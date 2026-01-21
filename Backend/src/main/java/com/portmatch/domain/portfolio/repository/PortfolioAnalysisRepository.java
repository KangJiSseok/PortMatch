package com.portmatch.domain.portfolio.repository;

import com.portmatch.domain.portfolio.entity.PortfolioAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PortfolioAnalysisRepository extends JpaRepository<PortfolioAnalysis, Long>, PortfolioAnalysisQueryRepository {

    Optional<PortfolioAnalysis> findByPortfolioId(Long portfolioId);
}
