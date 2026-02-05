package com.portmatch.domain.companyproject.recommendation.service;

import com.portmatch.domain.companyproject.recommendation.dto.CompanyRecommendationResponse;
import com.portmatch.domain.companyproject.recommendation.repository.CompanyRecommendationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyRecommendationService {

    private final CompanyRecommendationRepository repository;

    public List<CompanyRecommendationResponse> recommendTop10(Long portfolioId) {
        return repository.findTopCompaniesByPortfolio(portfolioId, 20).stream()
                .map(r -> CompanyRecommendationResponse.of(
                        r.getCompanyId(),
                        r.getCompanyName(),
                        nvl(r.getJobPostingSize(), 0L),
                        nvl(r.getDistance(), 999.0),
                        r.getPortfolioProjectId(),
                        r.getCompanyProjectId(),
                        r.getPortfolioContent(),
                        r.getCompanyContent(),
                        nvl(r.getProjectSimilarity(), 1.0),
                        nvl(r.getDomainSimilarity(), 1.0),
                        nvl(r.getProblemSimilarity(), 1.0),
                        nvl(r.getSolutionSimilarity(), 1.0),
                        nvl(r.getTechSimilarity(), 1.0)
                ))
                .toList();
    }

    private double nvl(Double value, double fallback) {
        return value == null ? fallback : value;
    }

    private long nvl(Long value, long fallback) {
        return value == null ? fallback : value;
    }
}
