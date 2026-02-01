package com.portmatch.domain.portfolio.recommendation.service;

import com.portmatch.domain.portfolio.embedding.client.PortfolioAnalysisClient;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioQueryEmbeddingRequest;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioQueryEmbeddingResponse;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioUserTagRecommendationRepository;
import com.portmatch.domain.portfolio.embedding.repository.UserTagRecommendationRow;
import com.portmatch.domain.portfolio.recommendation.dto.PortfolioQueryRecommendationResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class PortfolioQueryRecommendationService {

    private final PortfolioAnalysisClient embeddingClient;
    private final PortfolioUserTagRecommendationRepository tagEmbeddingRepository;

    public PortfolioQueryRecommendationService(
            PortfolioAnalysisClient embeddingClient,
            PortfolioUserTagRecommendationRepository tagEmbeddingRepository
    ) {
        this.embeddingClient = embeddingClient;
        this.tagEmbeddingRepository = tagEmbeddingRepository;
    }

    public PortfolioQueryRecommendationResponse recommendByQuery(String query, Integer limit) {
        int resolvedLimit = (limit == null || limit <= 0) ? 10 : limit;
        PortfolioQueryEmbeddingResponse embedding = embeddingClient.embedQuery(
                new PortfolioQueryEmbeddingRequest(query, null)
        );

        String techVector = toVectorString(embedding.techEmbedding());
        String keywordVector = toVectorString(embedding.keywordEmbedding());
        String architectureVector = toVectorString(embedding.architectureEmbedding());
        String unifiedVector = toVectorString(embedding.unifiedEmbedding());

        // 새로운 가중치: unified 0.5, architecture 0.3, tech 0.2
        // missing인 경우 가중치를 낮춤
        double techWeight = embedding.techMissing() ? 0.1 : 0.2;
        double architectureWeight = embedding.architectureMissing() ? 0.15 : 0.3;
        double unifiedWeight = 0.5;

        List<UserTagRecommendationRow> rows = tagEmbeddingRepository.findTopUsersByQueryEmbedding(
                techVector,
                keywordVector,
                architectureVector,
                unifiedVector,
                techWeight,
                architectureWeight,
                unifiedWeight,
                resolvedLimit
        );

        List<PortfolioQueryRecommendationResponse.Item> items = rows.stream()
                .map(r -> new PortfolioQueryRecommendationResponse.Item(
                        r.getUserId(),
                        r.getPortfolioId(),
                        safe(r.getTechSimilarity()),
                        safe(r.getKeywordSimilarity()),
                        safe(r.getArchitectureSimilarity()),
                        safe(r.getUnifiedSimilarity()),
                        r.getTechText(),
                        r.getKeywordText(),
                        r.getArchitectureText(),
                        r.getUnifiedText(),
                        safe(r.getSimilarity())
                ))
                .toList();

        return new PortfolioQueryRecommendationResponse(
                embedding.tech(),
                embedding.keywords(),
                embedding.architectureExperience(),
                embedding.expandedConcepts(),
                items
        );
    }

    private double safe(Double value) {
        return value == null ? 0.0 : value;
    }

    private String toVectorString(List<Double> vector) {
        if (vector == null || vector.isEmpty()) {
            throw new IllegalArgumentException("Vector must not be null or empty");
        }
        return "[" + vector.stream()
                .map(String::valueOf)
                .reduce((a, b) -> a + "," + b)
                .orElse("") + "]";
    }
}

