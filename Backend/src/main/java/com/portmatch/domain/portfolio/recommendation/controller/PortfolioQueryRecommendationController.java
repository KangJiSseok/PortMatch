package com.portmatch.domain.portfolio.recommendation.controller;

import com.portmatch.domain.portfolio.recommendation.dto.PortfolioQueryRecommendationRequest;
import com.portmatch.domain.portfolio.recommendation.dto.PortfolioQueryRecommendationResponse;
import com.portmatch.domain.portfolio.recommendation.service.PortfolioQueryRecommendationService;
import com.portmatch.global.api.BaseApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/portfolios")
@Tag(name = "포트폴리오", description = "포트폴리오 검색/추천 API")
public class PortfolioQueryRecommendationController {

    private final PortfolioQueryRecommendationService service;

    public PortfolioQueryRecommendationController(PortfolioQueryRecommendationService service) {
        this.service = service;
    }

    @Operation(
            summary = "질의 기반 사용자 추천",
            description = "질의를 LLM으로 분해하고 태그 임베딩으로 유사도 기반 사용자를 추천합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "추천 결과",
            content = @Content(schema = @Schema(implementation = PortfolioQueryRecommendationResponse.class))
    )
    @PostMapping("/recommendations/users")
    public BaseApiResponse<List<PortfolioQueryRecommendationResponse>> recommendUsersByQuery(
            @RequestBody PortfolioQueryRecommendationRequest request
    ) {
        String query = request == null ? null : request.query();
        if (query == null || query.isBlank()) {
            return BaseApiResponse.error(400, "query is required");
        }
        return BaseApiResponse.ok(service.recommendByQuery(query, request.limit()));
    }
}
