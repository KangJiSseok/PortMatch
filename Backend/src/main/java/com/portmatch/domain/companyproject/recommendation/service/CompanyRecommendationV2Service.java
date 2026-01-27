package com.portmatch.domain.companyproject.recommendation.service;

import com.portmatch.domain.portfolio.repository.PortfolioRepository;
import com.portmatch.domain.companyproject.recommendation.dto.CompanyRecommendationWithContentResponse;
import com.portmatch.domain.companyproject.recommendation.repository.CompanyRecommendationV2Repository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyRecommendationV2Service {

    private final CompanyRecommendationV2Repository repository;
    private final PortfolioRepository portfolioRepository;

    public List<CompanyRecommendationWithContentResponse> recommendTop10ByPortfolioId(Long portfolioId) {
        if (!portfolioRepository.existsById(portfolioId)) {
            throw new BusinessException(ResponseCode.PORTFOLIO_NOT_FOUND);
        }

        return repository.findTopCompaniesByPortfolio(portfolioId, 10).stream()
                .map(r -> CompanyRecommendationWithContentResponse.of(
                        r.getCompanyId(),
                        r.getCompanyProjectId(),
                        r.getCompanyContent(),
                        r.getPortfolioProjectId(),
                        r.getPortfolioContent(),
                        r.getDistance() == null ? 999.0 : r.getDistance()
                ))
                .toList();
    }
}
