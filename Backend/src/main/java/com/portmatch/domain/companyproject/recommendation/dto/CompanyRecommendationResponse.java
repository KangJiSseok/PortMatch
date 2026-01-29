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
        double projectDistance,
        double domainDistance,
        double problemDistance,
        double solutionDistance,
        double techDistance
) {
    public static CompanyRecommendationResponse of(
            Long companyId,
            String companyName,
            double distance,
            Long portfolioProjectId,
            Long companyProjectId,
            String portfolioContent,
            String companyContent,
            double projectDistance,
            double domainDistance,
            double problemDistance,
            double solutionDistance,
            double techDistance
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
                projectDistance,
                domainDistance,
                problemDistance,
                solutionDistance,
                techDistance
        );
    }
}
