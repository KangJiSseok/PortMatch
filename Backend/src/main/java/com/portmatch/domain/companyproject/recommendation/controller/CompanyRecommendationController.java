package com.portmatch.domain.companyproject.recommendation.controller;

import com.portmatch.domain.companyproject.recommendation.dto.CompanyRecommendationResponse;
import com.portmatch.domain.companyproject.recommendation.service.CompanyRecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "기업 추천", description = "포트폴리오 기반 기업 추천 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/portfolios")
public class CompanyRecommendationController {

    private final CompanyRecommendationService service;

    @Operation(summary = "기업 추천 조회", description = "포트폴리오 기반으로 추천 기업 리스트를 반환합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공")
    })
    @GetMapping("/{portfolioId}/recommendations/companies")
    public List<CompanyRecommendationResponse> recommendCompanies(
            @Parameter(description = "포트폴리오 ID", example = "1") @PathVariable Long portfolioId
    ) {
        return service.recommendTop10(portfolioId);
    }
}
