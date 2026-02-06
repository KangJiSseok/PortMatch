package com.portmatch.domain.companyproject.embedding.client;

import com.portmatch.domain.companyproject.embedding.dto.CompanyEmbeddingRequest;
import com.portmatch.domain.companyproject.embedding.dto.CompanyEmbeddingResponse;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Component
public class CompanyEmbeddingClient {

    private final RestClient restClient;
    private final String baseUrl;

    public CompanyEmbeddingClient(
            RestClient.Builder restClientBuilder,
            @Value("${company-embedding.base-url}") String baseUrl
    ) {
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        rf.setReadTimeout((int) Duration.ofMinutes(2).toMillis());

        this.restClient = restClientBuilder
                .requestFactory(rf)
                .build();

        this.baseUrl = normalize(baseUrl);
    }

    public CompanyEmbeddingResponse embed(CompanyEmbeddingRequest payload) {
        String endpoint = baseUrl + "/embeddings/company";

        try {
            ResponseEntity<CompanyEmbeddingResponse> response =
                    restClient.post()
                            .uri(endpoint)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(payload)
                            .retrieve()
                            .toEntity(CompanyEmbeddingResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }

            throw new BusinessException(ResponseCode.COMPANY_EMBEDDING_EMPTY);
        } catch (RestClientException e) {
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
