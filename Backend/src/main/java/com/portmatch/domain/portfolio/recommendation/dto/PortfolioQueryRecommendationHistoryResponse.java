package com.portmatch.domain.portfolio.recommendation.dto;

import java.time.LocalDateTime;
import java.util.List;

public record PortfolioQueryRecommendationHistoryResponse(
        List<QueryHistory> histories
) {
    public record QueryHistory(
            Long id,
            String query,
            LocalDateTime createdAt,
            List<RecommendationItem> recommendations
    ) {}

    public record RecommendationItem(
            Long userId,
            String userName,
            Long portfolioId,
            String portfolioName,
            double similarity
    ) {}
}
