package com.portmatch.domain.portfolio.embedding.repository;

public interface UserTagRecommendationRow {
    Long getUserId();
    Long getPortfolioId();
    Double getTechSimilarity();
    Double getKeywordSimilarity();
    Double getArchitectureSimilarity();
    Double getSimilarity();
}
