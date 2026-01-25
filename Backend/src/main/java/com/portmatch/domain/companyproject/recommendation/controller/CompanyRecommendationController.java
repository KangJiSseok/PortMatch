package com.portmatch.domain.companyproject.recommendation.controller;

import com.portmatch.domain.companyproject.recommendation.dto.CompanyRecommendationResponse;
import com.portmatch.domain.companyproject.recommendation.service.CompanyRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/recommendations")
public class CompanyRecommendationController {

    private final CompanyRecommendationService service;

    // 기업 10개 추천
    @GetMapping("/companies")
    public List<CompanyRecommendationResponse> recommendCompanies(
            @RequestParam Long portfolioId
    ) {
        return service.recommendTop10(portfolioId);
    }
}
