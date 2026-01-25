package com.portmatch.domain.portfolio.embedding.client;

import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingRequest;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingResponse;
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

@Slf4j
@Component
public class PortfolioAnalysisClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public PortfolioAnalysisClient(
            RestTemplateBuilder builder,
            @Value("${portfolio-embedding.base-url}") String baseUrl
    ) {
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        rf.setReadTimeout((int) Duration.ofMinutes(2).toMillis());

        this.restTemplate = builder.requestFactory(() -> rf).build();
        this.baseUrl = normalize(baseUrl);
    }

    public PortfolioEmbeddingResponse embed(PortfolioEmbeddingRequest request) {
        String endpoint = baseUrl + "/embeddings";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            ResponseEntity<PortfolioEmbeddingResponse> res = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    new HttpEntity<>(request, headers),
                    PortfolioEmbeddingResponse.class
            );
            if (res.getBody() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Embedding service returned empty body");
            }
            return res.getBody();
        } catch (RestClientException e) {
            log.error("Embedding request failed. endpoint={}", endpoint, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Embedding service unavailable", e);
        }
    }

    private String normalize(String url) {
        if (url == null || url.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "portfolio-embedding.base-url is not configured");
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
