package com.portmatch.domain.companyproject.recommendation.dto;

public record CompanyRecommendationResponse(
        Long companyId,
        String companyName,
        double distance,
        double similarity,
        Long portfolioProjectId,
        Long companyProjectId,
        String portfolioContent,
        String companyContent,
        double projectSimilarity,
        double domainSimilarity,
        double problemSimilarity,
        double solutionSimilarity,
        double techSimilarity
) {
    public static CompanyRecommendationResponse of(
            Long companyId,
            String companyName,
            double distance,
            Long portfolioProjectId,
            Long companyProjectId,
            String portfolioContent,
            String companyContent,
            double projectSimilarity,
            double domainSimilarity,
            double problemSimilarity,
            double solutionSimilarity,
            double techSimilarity
    ) {
        return new CompanyRecommendationResponse(
                companyId,
                companyName,
                distance,
                1.0 - distance,
                portfolioProjectId,
                companyProjectId,
                portfolioContent,
                companyContent,
                projectSimilarity,
                domainSimilarity,
                problemSimilarity,
                solutionSimilarity,
                techSimilarity
        );
    }
}
