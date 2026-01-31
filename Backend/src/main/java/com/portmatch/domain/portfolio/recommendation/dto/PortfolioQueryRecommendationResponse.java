package com.portmatch.domain.portfolio.recommendation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record PortfolioQueryRecommendationResponse(
        @JsonProperty("tech")
        List<String> tech,
        @JsonProperty("keywords")
        List<String> keywords,
        @JsonProperty("architecture_experience")
        List<String> architectureExperience,
        @JsonProperty("recommendations")
        List<Item> recommendations
) {
    public record Item(
            Long userId,
            Long portfolioId,
            double techSimilarity,
            double keywordSimilarity,
            double architectureSimilarity,
            String techText,
            String keywordText,
            String architectureText,
            double similarity
    ) {}
}
