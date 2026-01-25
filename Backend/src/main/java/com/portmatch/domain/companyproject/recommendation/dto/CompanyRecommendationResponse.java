package com.portmatch.domain.companyproject.recommendation.dto;

public record CompanyRecommendationResponse(
        Long companyId,
        double distance,
        double similarity
) {
    public static CompanyRecommendationResponse of(Long companyId, double distance) {
        // distance(0~2 근처) → similarity(1 - distance)로 간단 변환 (MVP용)
        return new CompanyRecommendationResponse(companyId, distance, 1.0 - distance);
    }
}
