package com.portmatch.domain.portfolio.embeddingv2.client;

import com.portmatch.domain.portfolio.embeddingv2.dto.OpenAiEmbeddingRequest;
import com.portmatch.domain.portfolio.embeddingv2.dto.OpenAiEmbeddingResponse;
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
import java.util.List;

@Component
@Slf4j
public class PortfolioOpenAiEmbeddingClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String apiKey;
    private final String model;

    public PortfolioOpenAiEmbeddingClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${openai.base-url:https://api.openai.com}") String baseUrl,
            @Value("${openai.api-key:${OPENAI_API_KEY:}}") String apiKey,
            @Value("${openai.embedding-model:text-embedding-3-small}") String model
    ) {
        SimpleClientHttpRequestFactory rf = new SimpleClientHttpRequestFactory();
        rf.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        rf.setReadTimeout((int) Duration.ofMinutes(2).toMillis());

        this.restTemplate = restTemplateBuilder
                .requestFactory(() -> rf)
                .build();

        this.baseUrl = normalize(baseUrl);
        this.apiKey = apiKey;
        this.model = model;

        if (this.apiKey == null || this.apiKey.isBlank()) {
            throw new BusinessException(ResponseCode.OPENAI_API_KEY_NOT_CONFIGURED);
        }
    }

    public OpenAiEmbeddingResponse embed(List<String> texts) {
        String endpoint = baseUrl + "/v1/embeddings";
        OpenAiEmbeddingRequest payload = new OpenAiEmbeddingRequest(model, texts);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<OpenAiEmbeddingRequest> request = new HttpEntity<>(payload, headers);

        try {
            ResponseEntity<OpenAiEmbeddingResponse> response =
                    restTemplate.exchange(endpoint, HttpMethod.POST, request, OpenAiEmbeddingResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }

            throw new BusinessException(ResponseCode.OPENAI_EMBEDDING_EMPTY);
        } catch (RestClientException e) {
            log.error("OpenAI embedding request failed. endpoint={}", endpoint, e);
            throw new BusinessException(ResponseCode.OPENAI_EMBEDDING_SERVICE_UNAVAILABLE);
        }
    }

    private String normalize(String url) {
        if (url == null || url.isBlank()) {
            throw new BusinessException(ResponseCode.OPENAI_BASE_URL_NOT_CONFIGURED);
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
