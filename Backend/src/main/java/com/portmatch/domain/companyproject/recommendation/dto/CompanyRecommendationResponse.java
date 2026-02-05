package com.portmatch.domain.companyproject.recommendation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public record CompanyRecommendationResponse(
        Long companyId,
        String companyName,
        @Schema(description = "해당 기업의 채용 중(active=1) 공고 수", example = "5")
        Long jobPostingSize,
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
            Long jobPostingSize,
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
                jobPostingSize,
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
