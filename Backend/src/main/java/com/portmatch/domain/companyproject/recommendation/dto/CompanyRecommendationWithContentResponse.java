package com.portmatch.domain.companyproject.recommendation.dto;

public record CompanyRecommendationWithContentResponse(
        Long companyId,
        Long companyProjectId,
        String companyContent,
        Long portfolioProjectId,
        String portfolioContent,
        double distance,
        double similarity
) {
    public static CompanyRecommendationWithContentResponse of(
            Long companyId,
            Long companyProjectId,
            String companyContent,
            Long portfolioProjectId,
            String portfolioContent,
            double distance
    ) {
        return new CompanyRecommendationWithContentResponse(
                companyId,
                companyProjectId,
                companyContent,
                portfolioProjectId,
                portfolioContent,
                distance,
                1.0 - distance
        );
    }
}
