package com.portmatch.domain.companyproject.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portmatch.domain.companyproject.dto.ExplanationMatchPayload;
import com.portmatch.domain.companyproject.dto.ExplanationServiceRequest;
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

@Component
public class ExplanationClient {

    private final RestClient restClient;
    private final String explanationBaseUrl;
    private final ObjectMapper objectMapper;

    public ExplanationClient(
            RestClient.Builder restClientBuilder,
            @Value("${explanation.base-url}") String explanationBaseUrl,
            ObjectMapper objectMapper
    ) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        requestFactory.setReadTimeout((int) Duration.ofMinutes(2).toMillis());
        this.restClient = restClientBuilder
                .requestFactory(requestFactory)
                .build();
        this.explanationBaseUrl = explanationBaseUrl;
        this.objectMapper = objectMapper;
    }

    public ExplanationMatchPayload explain(ExplanationServiceRequest payload) {
        String endpoint = normalizeBaseUrl(explanationBaseUrl) + "/explanations/match";
        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException exception) {
            throw new BusinessException(ResponseCode.EXPLANATION_PAYLOAD_FAILED);
        }

        byte[] payloadBytes = payloadJson.getBytes(StandardCharsets.UTF_8);
        try {
            ResponseEntity<ExplanationMatchPayload> response =
                    restClient.post()
                            .uri(endpoint)
                            .contentType(MediaType.APPLICATION_JSON)
                            .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(payloadBytes.length))
                            .body(payloadBytes)
                            .retrieve()
                            .toEntity(ExplanationMatchPayload.class);
            ExplanationMatchPayload body = response.getBody();
            if (body == null) {
                throw new BusinessException(ResponseCode.EXPLANATION_RESPONSE_EMPTY);
            }
            return body;
        } catch (RestClientException exception) {
            throw new BusinessException(ResponseCode.EXPLANATION_SERVICE_UNAVAILABLE);
        }
    }

    private String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) {
            throw new BusinessException(ResponseCode.EXPLANATION_BASE_URL_NOT_CONFIGURED);
        }
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }
}
