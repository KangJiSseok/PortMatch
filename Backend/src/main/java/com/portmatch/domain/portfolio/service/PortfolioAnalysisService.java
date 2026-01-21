package com.portmatch.domain.portfolio.service;

import com.portmatch.domain.portfolio.dto.PresignedUrlResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;

import java.time.Duration;
import java.util.Map;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class PortfolioAnalysisService {

    private final PortfolioService portfolioService;
    private final RestTemplate restTemplate;
    private final String portfolioAnalysisBaseUrl;
    private final ObjectMapper objectMapper;

    public PortfolioAnalysisService(
            PortfolioService portfolioService,
            RestTemplateBuilder restTemplateBuilder,
            @Value("${portfolio-analysis.base-url}") String portfolioAnalysisBaseUrl,
            ObjectMapper objectMapper
    ) {
        this.portfolioService = portfolioService;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        requestFactory.setReadTimeout((int) Duration.ofMinutes(2).toMillis());
        this.restTemplate = restTemplateBuilder
                .requestFactory(() -> requestFactory)
                .build();
        this.portfolioAnalysisBaseUrl = portfolioAnalysisBaseUrl;
        this.objectMapper = objectMapper;
    }

    public Object analyze(Long portfolioId) {
        PresignedUrlResponse presigned = portfolioService.getPresignedUrl(portfolioId, 10);
        String endpoint = normalizeBaseUrl(portfolioAnalysisBaseUrl) + "/api/parse";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(Map.of("s3_url", presigned.getUrl()));
        } catch (JsonProcessingException exception) {
            log.error("Failed to prepare portfolio analysis request payload", exception);
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to prepare analysis request",
                    exception
            );
        }

        byte[] payloadBytes = payloadJson.getBytes(StandardCharsets.UTF_8);
        headers.setContentLength(payloadBytes.length);
        HttpEntity<byte[]> request = new HttpEntity<>(payloadBytes, headers);
        try {
            ResponseEntity<Object> response = restTemplate.exchange(endpoint, HttpMethod.POST, request, Object.class);
            return response.getBody();
        } catch (RestClientException exception) {
            log.error("Portfolio analysis request failed. endpoint={}", endpoint, exception);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Portfolio analysis service unavailable",
                    exception
            );
        }
    }

    private String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Portfolio analysis base URL is not configured"
            );
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
