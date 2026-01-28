package com.portmatch.domain.portfolio.embeddingv3.client;

import com.portmatch.domain.portfolio.embeddingv3.dto.GeminiEmbeddingRequest;
import com.portmatch.domain.portfolio.embeddingv3.dto.GeminiEmbeddingResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.List;

@Component
@Slf4j
public class PortfolioGeminiEmbeddingClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String model;

    public PortfolioGeminiEmbeddingClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${embedding-v3.base-url}") String baseUrl,
            @Value("${embedding-v3.model:models/gemini-embedding-001}") String model
    ) {
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        rf.setReadTimeout((int) Duration.ofMinutes(2).toMillis());

        this.restTemplate = restTemplateBuilder
                .requestFactory(() -> rf)
                .build();

        this.baseUrl = normalize(baseUrl);
        this.model = model;
    }

    public GeminiEmbeddingResponse embed(List<String> texts) {
        String endpoint = baseUrl + "/embeddings/gemini";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        GeminiEmbeddingRequest payload = new GeminiEmbeddingRequest(texts, model);
        HttpEntity<GeminiEmbeddingRequest> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<GeminiEmbeddingResponse> response =
                    restTemplate.exchange(endpoint, HttpMethod.POST, request, GeminiEmbeddingResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }

            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Embedding service returned empty body");
        } catch (RestClientException e) {
            log.error("Gemini embedding request failed. endpoint={}", endpoint, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Embedding service unavailable", e);
        }
    }

    private String normalize(String url) {
        if (url == null || url.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "embedding-v3.base-url is not set");
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
