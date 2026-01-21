package com.portmatch.domain.portfolio.repository;

import com.portmatch.domain.portfolio.entity.PortfolioAnalysis;

import java.util.Optional;

public interface PortfolioAnalysisQueryRepository {

    Optional<PortfolioAnalysis> findWithProjectsByPortfolioId(Long portfolioId);
}
