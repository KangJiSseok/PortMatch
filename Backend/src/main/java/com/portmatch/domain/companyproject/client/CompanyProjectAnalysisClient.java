package com.portmatch.domain.companyproject.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

@Component
@Slf4j
public class CompanyProjectAnalysisClient {

    private final RestTemplate restTemplate;
    private final String companyProjectAnalysisBaseUrl;
    private final ObjectMapper objectMapper;

    public CompanyProjectAnalysisClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${company-project-analysis.base-url}") String companyProjectAnalysisBaseUrl,
            ObjectMapper objectMapper
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        requestFactory.setReadTimeout((int) Duration.ofMinutes(2).toMillis());
        this.restTemplate = restTemplateBuilder
                .requestFactory(() -> requestFactory)
                .build();
        this.companyProjectAnalysisBaseUrl = companyProjectAnalysisBaseUrl;
        this.objectMapper = objectMapper;
    }

    public Object analyzeCompanyProject(String companyName) {
        String endpoint = normalizeBaseUrl(companyProjectAnalysisBaseUrl) + "/api/company-project-analysis";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(Map.of("company_name", companyName));
        } catch (JsonProcessingException exception) {
            log.error("Failed to prepare company project analysis request payload", exception);
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
            log.error("Company project analysis request failed. endpoint={}", endpoint, exception);
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Company project analysis service unavailable",
                    exception
            );
        }
    }

    private String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Company project analysis base URL is not configured"
            );
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
