package com.portmatch.domain.portfolio.embedding.client;

import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingRequest;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingResponse;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioQueryEmbeddingRequest;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioQueryEmbeddingResponse;
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
public class PortfolioAnalysisClient {

    private final RestClient restClient;
    private final String baseUrl;

    public PortfolioAnalysisClient(
            RestClient.Builder builder,
            @Value("${portfolio-embedding.base-url}") String baseUrl
    ) {
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        rf.setReadTimeout((int) Duration.ofMinutes(2).toMillis());

        this.restClient = builder.requestFactory(rf).build();
        this.baseUrl = normalize(baseUrl);
    }

    public PortfolioEmbeddingResponse embed(PortfolioEmbeddingRequest request) {
        String endpoint = baseUrl + "/embeddings/portfolio";

        try {
            ResponseEntity<PortfolioEmbeddingResponse> res = restClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .toEntity(PortfolioEmbeddingResponse.class);
            if (res.getBody() == null) {
                //throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Embedding service returned empty body");
                throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_EMPTY);
            }
            return res.getBody();
        } catch (RestClientException e) {
            //throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Embedding service unavailable", e);
            throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_SERVICE_UNAVAILABLE);
        }
    }

    public PortfolioEmbeddingResponse embedTags(PortfolioEmbeddingRequest request) {
        String endpoint = baseUrl + "/embeddings/portfolio-tags";

        try {
            ResponseEntity<PortfolioEmbeddingResponse> res = restClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .toEntity(PortfolioEmbeddingResponse.class);
            if (res.getBody() == null) {
                throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_EMPTY);
            }
            return res.getBody();
        } catch (RestClientException e) {
            throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_SERVICE_UNAVAILABLE);
        }
    }

    public PortfolioQueryEmbeddingResponse embedQuery(PortfolioQueryEmbeddingRequest request) {
        String endpoint = baseUrl + "/embeddings/portfolio-query";

        try {
            ResponseEntity<PortfolioQueryEmbeddingResponse> res = restClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .toEntity(PortfolioQueryEmbeddingResponse.class);
            if (res.getBody() == null) {
                throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_EMPTY);
            }
            return res.getBody();
        } catch (RestClientException e) {
            throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_SERVICE_UNAVAILABLE);
        }
    }

    private String normalize(String url) {
        if (url == null || url.isBlank()) {
            throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_BASE_URL_NOT_CONFIGURED);
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
