package com.portmatch.domain.companyproject.embedding.client;

import com.portmatch.domain.companyproject.embedding.dto.CompanyEmbeddingRequest;
import com.portmatch.domain.companyproject.embedding.dto.CompanyEmbeddingResponse;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

@Component
@Slf4j
public class CompanyEmbeddingClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public CompanyEmbeddingClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${company-embedding.base-url}") String baseUrl
    ) {
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        rf.setReadTimeout((int) Duration.ofMinutes(2).toMillis());

        this.restTemplate = restTemplateBuilder
                .requestFactory(() -> rf)
                .build();

        this.baseUrl = normalize(baseUrl);
    }

    public CompanyEmbeddingResponse embed(CompanyEmbeddingRequest payload) {
        String endpoint = baseUrl + "/embeddings/company";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<CompanyEmbeddingRequest> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<CompanyEmbeddingResponse> response =
                    restTemplate.exchange(endpoint, HttpMethod.POST, request, CompanyEmbeddingResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }

            throw new BusinessException(ResponseCode.COMPANY_EMBEDDING_EMPTY);
        } catch (RestClientException e) {
            log.error("Embedding request failed. endpoint={}", endpoint, e);
            throw new BusinessException(ResponseCode.COMPANY_EMBEDDING_SERVICE_UNAVAILABLE);
        }
    }

    private String normalize(String url) {
        if (url == null || url.isBlank()) {
            throw new BusinessException(ResponseCode.COMPANY_EMBEDDING_BASE_URL_NOT_CONFIGURED);
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
