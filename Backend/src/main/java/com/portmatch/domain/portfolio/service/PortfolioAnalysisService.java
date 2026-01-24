package com.portmatch.domain.portfolio.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portmatch.domain.portfolio.dto.PresignedUrlResponse;
import com.portmatch.domain.portfolio.dto.PortfolioAnalysisResponse;
import com.portmatch.domain.portfolio.entity.Portfolio;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysis;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProject;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProjectTech;
import com.portmatch.domain.portfolio.repository.PortfolioAnalysisRepository;
import com.portmatch.domain.portfolio.repository.PortfolioRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@Slf4j
public class PortfolioAnalysisService {

    private final PortfolioService portfolioService;
    private final PortfolioRepository portfolioRepository;
    private final PortfolioAnalysisRepository portfolioAnalysisRepository;
    private final RestTemplate restTemplate;
    private final String portfolioAnalysisBaseUrl;
    private final ObjectMapper objectMapper;

    public PortfolioAnalysisService(
            PortfolioService portfolioService,
            PortfolioRepository portfolioRepository,
            PortfolioAnalysisRepository portfolioAnalysisRepository,
            RestTemplateBuilder restTemplateBuilder,
            @Value("${portfolio-analysis.base-url}") String portfolioAnalysisBaseUrl,
            ObjectMapper objectMapper
    ) {
        this.portfolioService = portfolioService;
        this.portfolioRepository = portfolioRepository;
        this.portfolioAnalysisRepository = portfolioAnalysisRepository;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        requestFactory.setReadTimeout((int) Duration.ofMinutes(10).toMillis());
        this.restTemplate = restTemplateBuilder
                .requestFactory(() -> requestFactory)
                .build();
        this.portfolioAnalysisBaseUrl = portfolioAnalysisBaseUrl;
        this.objectMapper = objectMapper;
    }

    public Object analyze(Long userId, Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.PORTFOLIO_NOT_FOUND));
        PresignedUrlResponse presigned = portfolioService.getPresignedUrlForUser(userId, portfolioId, 10);
        String endpoint = normalizeBaseUrl(portfolioAnalysisBaseUrl) + "/api/parse";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(Map.of("s3_url", presigned.getUrl()));
        } catch (JsonProcessingException exception) {
            log.error("Failed to prepare portfolio analysis request payload", exception);
            throw new BusinessException(ResponseCode.PORTFOLIO_ANALYSIS_PAYLOAD_FAILED);
        }

        byte[] payloadBytes = payloadJson.getBytes(StandardCharsets.UTF_8);
        headers.setContentLength(payloadBytes.length);
        HttpEntity<byte[]> request = new HttpEntity<>(payloadBytes, headers);
        try {
            ResponseEntity<Object> response = restTemplate.exchange(endpoint, HttpMethod.POST, request, Object.class);
            Object body = response.getBody();
            persistResult(portfolio, body);
            return body;
        } catch (RestClientException exception) {
            log.error("Portfolio analysis request failed. endpoint={}", endpoint, exception);
            throw new BusinessException(ResponseCode.PORTFOLIO_ANALYSIS_SERVICE_UNAVAILABLE);
        }
    }

    @Transactional(readOnly = true)
    public PortfolioAnalysisResponse getAnalysis(Long userId, Long portfolioId) {
        portfolioRepository.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.PORTFOLIO_NOT_FOUND));
        PortfolioAnalysis analysis = portfolioAnalysisRepository.findWithProjectsByPortfolioId(portfolioId)
                .orElseThrow(() -> new BusinessException(ResponseCode.ANALYSIS_NOT_FOUND));

        List<PortfolioAnalysisResponse.Project> projects = analysis.getProjects().stream()
                .map(project -> new PortfolioAnalysisResponse.Project(
                        project.getName(),
                        project.getProblem(),
                        project.getSolution(),
                        project.getTechs().stream()
                                .map(PortfolioAnalysisProjectTech::getTech)
                                .toList()
                ))
                .toList();

        return new PortfolioAnalysisResponse(projects);
    }

    private void persistResult(Portfolio portfolio, Object body) {
        if (body == null) {
            throw new BusinessException(ResponseCode.PORTFOLIO_ANALYSIS_EMPTY);
        }

        PortfolioAnalysisResponse result = objectMapper.convertValue(body, PortfolioAnalysisResponse.class);

        PortfolioAnalysis analysis = portfolioAnalysisRepository.findByPortfolioId(portfolio.getId())
                .orElseGet(() -> new PortfolioAnalysis(portfolio));

        analysis.replaceProjects(buildProjects(analysis, result));
        portfolioAnalysisRepository.save(analysis);
    }

    private List<PortfolioAnalysisProject> buildProjects(
            PortfolioAnalysis analysis,
            PortfolioAnalysisResponse result
    ) {
        if (result == null || result.projects() == null) {
            return List.of();
        }

        return result.projects().stream()
                .filter(project -> project != null && project.name() != null && !project.name().isBlank())
                .map(project -> {
                    PortfolioAnalysisProject entity = new PortfolioAnalysisProject(
                            analysis,
                            project.name(),
                            project.problem(),
                            project.solution()
                    );
                    if (project.tech() != null) {
                        project.tech().stream()
                                .filter(tech -> tech != null && !tech.isBlank())
                                .forEach(entity::addTech);
                    }
                    return entity;
                })
                .toList();
    }

    private String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new BusinessException(ResponseCode.PORTFOLIO_ANALYSIS_BASE_URL_NOT_CONFIGURED);
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
