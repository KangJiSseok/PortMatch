package com.portmatch.domain.companyproject.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

@Component
public class CompanyProjectAnalysisClient {

    private final RestClient restClient;
    private final String companyProjectAnalysisBaseUrl;
    private final ObjectMapper objectMapper;

    public CompanyProjectAnalysisClient(
            RestClient.Builder restClientBuilder,
            @Value("${company-project-analysis.base-url}") String companyProjectAnalysisBaseUrl,
            ObjectMapper objectMapper
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        requestFactory.setReadTimeout((int) Duration.ofMinutes(2).toMillis());
        this.restClient = restClientBuilder
                .requestFactory(requestFactory)
                .build();
        this.companyProjectAnalysisBaseUrl = companyProjectAnalysisBaseUrl;
        this.objectMapper = objectMapper;
    }

    public Object analyzeCompanyProject(String companyName) {
        String endpoint = normalizeBaseUrl(companyProjectAnalysisBaseUrl) + "/api/company-project-analysis";
        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(Map.of("company_name", companyName));
        } catch (JsonProcessingException exception) {
            throw new BusinessException(ResponseCode.COMPANY_PROJECT_ANALYSIS_PAYLOAD_FAILED);
        }

        byte[] payloadBytes = payloadJson.getBytes(StandardCharsets.UTF_8);
        try {
            ResponseEntity<Object> response = restClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(payloadBytes.length))
                    .body(payloadBytes)
                    .retrieve()
                    .toEntity(Object.class);
            return response.getBody();
        } catch (RestClientException exception) {
            throw new BusinessException(ResponseCode.COMPANY_PROJECT_ANALYSIS_SERVICE_UNAVAILABLE);
        }
    }

    private String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new BusinessException(ResponseCode.COMPANY_PROJECT_ANALYSIS_BASE_URL_NOT_CONFIGURED);
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
