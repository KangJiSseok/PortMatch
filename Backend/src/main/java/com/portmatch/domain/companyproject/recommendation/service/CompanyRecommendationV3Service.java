package com.portmatch.domain.companyproject.recommendation.service;

import com.portmatch.domain.companyproject.recommendation.dto.CompanyRecommendationV3Response;
import com.portmatch.domain.companyproject.recommendation.repository.CompanyRecommendationV3Repository;
import com.portmatch.domain.portfolio.repository.PortfolioRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyRecommendationV3Service {

    private final CompanyRecommendationV3Repository repository;
    private final PortfolioRepository portfolioRepository;

    public List<CompanyRecommendationV3Response> recommendTop10ByPortfolioId(Long portfolioId) {
        if (!portfolioRepository.existsById(portfolioId)) {
            throw new BusinessException(ResponseCode.PORTFOLIO_NOT_FOUND);
        }

        return repository.findTopCompaniesByPortfolio(portfolioId, 10).stream()
                .map(r -> new CompanyRecommendationV3Response(
                        r.getCompanyId(),
                        r.getCompanyProjectId(),
                        r.getCompanyContent(),
                        r.getPortfolioProjectId(),
                        r.getPortfolioContent(),
                        safe(r.getNameSimilarity()),
                        safe(r.getProblemSimilarity()),
                        safe(r.getSolutionSimilarity()),
                        safe(r.getTechSimilarity()),
                        safe(r.getSimilarity())
                ))
                .toList();
    }

    private double safe(Double value) {
        return value == null ? 0.0 : value;
    }
}
