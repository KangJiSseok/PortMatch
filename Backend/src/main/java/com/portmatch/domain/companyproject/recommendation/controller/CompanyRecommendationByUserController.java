package com.portmatch.domain.companyproject.recommendation.controller;

import com.portmatch.domain.companyproject.recommendation.dto.CompanyRecommendationWithContentResponse;
import com.portmatch.domain.companyproject.recommendation.service.CompanyRecommendationV2Service;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/portfolios")
public class CompanyRecommendationByUserController {

    private final CompanyRecommendationV2Service service;

    // 포트폴리오 기준 기업 10개 추천 (기업ID 중복 없음)
    @GetMapping("/{portfolioId}/recommendations/companies-v2")
    public List<CompanyRecommendationWithContentResponse> recommendCompaniesByPortfolio(
            @PathVariable Long portfolioId
    ) {
        return service.recommendTop10ByPortfolioId(portfolioId);
    }
}
