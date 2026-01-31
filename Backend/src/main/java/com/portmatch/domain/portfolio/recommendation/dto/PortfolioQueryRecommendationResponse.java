package com.portmatch.domain.portfolio.recommendation.dto;

public record PortfolioQueryRecommendationResponse(
        Long userId,
        Long portfolioId,
        Long projectId,
        String content,
        double techSimilarity,
        double keywordSimilarity,
        double architectureSimilarity,
        double similarity
) {}
