package com.portmatch.domain.portfolio.embedding.controller;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingUpsertResult;
import com.portmatch.domain.portfolio.embedding.service.PortfolioEmbeddingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/portfolios")
@Tag(name = "포트폴리오 임베딩", description = "포트폴리오 프로젝트 임베딩 생성/저장 API")
public class PortfolioEmbeddingController {

    private final PortfolioEmbeddingService portfolioEmbeddingService;

    public PortfolioEmbeddingController(PortfolioEmbeddingService portfolioEmbeddingService) {
        this.portfolioEmbeddingService = portfolioEmbeddingService;
    }

    @Operation(summary = "내 포트폴리오 프로젝트 임베딩 생성/업서트")
    @PostMapping("/{portfolioId}/embeddings")
    public PortfolioEmbeddingUpsertResult buildEmbeddings(
            @AuthenticationPrincipal(expression = "user") User user,
            @PathVariable Long portfolioId
    ) {
        return portfolioEmbeddingService.buildForMyPortfolio(user.getId(), portfolioId);
    }
}
