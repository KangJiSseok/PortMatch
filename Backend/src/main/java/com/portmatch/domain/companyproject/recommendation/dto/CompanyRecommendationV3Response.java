package com.portmatch.domain.companyproject.recommendation.dto;

public record CompanyRecommendationV3Response(
        Long companyId,
        Long companyProjectId,
        String companyContent,
        Long portfolioProjectId,
        String portfolioContent,
        double nameSimilarity,
        double problemSimilarity,
        double solutionSimilarity,
        double techSimilarity,
        double similarity
) {}
