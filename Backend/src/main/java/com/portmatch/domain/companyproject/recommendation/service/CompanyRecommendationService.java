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
        return repository.findTopCompaniesByPortfolio(portfolioId, 10).stream()
                .map(r -> CompanyRecommendationResponse.of(
                        r.getCompanyId(),
                        r.getDistance() == null ? 999.0 : r.getDistance()
                ))
                .toList();
    }
}
