package com.portmatch.domain.portfolio.embeddingv2.controller;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.portfolio.embeddingv2.service.PortfolioEmbeddingV2Service;
import com.portmatch.domain.portfolio.service.PortfolioAnalysisService;
import com.portmatch.global.api.BaseApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portfolios")
@Tag(name = "포트폴리오", description = "포트폴리오 업로드 및 분석 API")
public class PortfolioAnalysisV2Controller {

    private final PortfolioAnalysisService portfolioAnalysisService;
    private final PortfolioEmbeddingV2Service portfolioEmbeddingV2Service;

    public PortfolioAnalysisV2Controller(
            PortfolioAnalysisService portfolioAnalysisService,
            PortfolioEmbeddingV2Service portfolioEmbeddingV2Service
    ) {
        this.portfolioAnalysisService = portfolioAnalysisService;
        this.portfolioEmbeddingV2Service = portfolioEmbeddingV2Service;
    }

    @Operation(
            summary = "내 포트폴리오 분석 요청 (V2)",
            description = "포트폴리오 분석 후 OpenAI 임베딩을 생성하고 저장합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "분석 요청 성공",
            content = @Content(schema = @Schema(implementation = Object.class))
    )
    @PostMapping("/me/{portfolioId}/analysis-v2")
    public BaseApiResponse<Object> analyzePortfolioV2(
            @Parameter(hidden = true)
            @AuthenticationPrincipal(expression = "user") User user,
            @Parameter(description = "포트폴리오 ID", required = true)
            @PathVariable Long portfolioId
    ) {
        Object result = portfolioAnalysisService.analyze(user.getId(), portfolioId);
        portfolioEmbeddingV2Service.buildForMyPortfolio(user.getId(), portfolioId);
        return BaseApiResponse.ok(result);
    }
}
