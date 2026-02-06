package com.portmatch.domain.jobposting.embedding.client;

import com.portmatch.domain.jobposting.embedding.dto.JobPostingEmbeddingRequest;
import com.portmatch.domain.jobposting.embedding.dto.JobPostingEmbeddingResponse;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;

@Component
public class JobPostingEmbeddingClient {

    private final RestClient restClient;
    private final String baseUrl;

    public JobPostingEmbeddingClient(
            RestClient.Builder restClientBuilder,
            @Value("${job-posting-embedding.base-url}") String baseUrl
    ) {
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        rf.setReadTimeout((int) Duration.ofMinutes(2).toMillis());

        this.restClient = restClientBuilder
                .requestFactory(rf)
                .build();

        this.baseUrl = normalize(baseUrl);
    }

    public JobPostingEmbeddingResponse embed(JobPostingEmbeddingRequest payload) {
        String endpoint = baseUrl + "/embeddings/job-posting";

        try {
            ResponseEntity<JobPostingEmbeddingResponse> response =
                    restClient.post()
                            .uri(endpoint)
                            .contentType(MediaType.APPLICATION_JSON)
                            .body(payload)
                            .retrieve()
                            .toEntity(JobPostingEmbeddingResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }

            throw new BusinessException(ResponseCode.JOB_POSTING_EMBEDDING_EMPTY);
        } catch (RestClientException e) {
            throw new BusinessException(ResponseCode.JOB_POSTING_EMBEDDING_SERVICE_UNAVAILABLE);
        }
    }

    private String normalize(String url) {
        if (url == null || url.isBlank()) {
            throw new BusinessException(ResponseCode.JOB_POSTING_EMBEDDING_BASE_URL_NOT_CONFIGURED);
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
