package com.portmatch.domain.portfolio.embedding.repository;

public interface TagRecommendationRow {
    Long getUserId();
    Long getPortfolioId();
    Long getProjectId();
    String getContent();
    Double getTechSimilarity();
    Double getKeywordSimilarity();
    Double getArchitectureSimilarity();
    Double getSimilarity();
}
