package com.portmatch.domain.portfolio.recommendation.dto;

public record PortfolioQueryRecommendationRequest(
        String query,
        Integer limit
) {}
