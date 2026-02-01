package com.portmatch.domain.portfolio.recommendation.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

public record PortfolioQueryRecommendationResponse(
        @JsonProperty("tech")
        List<String> tech,
        @JsonProperty("keywords")
        List<String> keywords,
        @JsonProperty("architecture_experience")
        List<String> architectureExperience,
        @JsonProperty("expanded_concepts")
        List<String> expandedConcepts,
        @JsonProperty("recommendations")
        List<Item> recommendations
) {
    public record Item(
            @Schema(description = "사용자 ID")
            Long userId,
            @Schema(description = "사용자 이름")
            String userName,
            @Schema(description = "포트폴리오 ID")
            Long portfolioId,
            @Schema(description = "기술 유사도")
            double techSimilarity,
            @Schema(description = "키워드 유사도")
            double keywordSimilarity,
            @Schema(description = "아키텍처 유사도")
            double architectureSimilarity,
            @Schema(description = "통합 유사도")
            double unifiedSimilarity,
            @Schema(description = "가장 유사한 기술 태그 텍스트")
            String techText,
            @Schema(description = "가장 유사한 키워드 태그 텍스트")
            String keywordText,
            @Schema(description = "가장 유사한 아키텍처 태그 텍스트")
            String architectureText,
            @Schema(description = "통합 텍스트")
            String unifiedText,
            @Schema(description = "최종 유사도")
            double similarity
    ) {}
}

