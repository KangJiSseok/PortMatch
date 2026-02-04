package com.portmatch.domain.portfolio.recommendation.repository;

import com.portmatch.domain.portfolio.recommendation.entity.PortfolioQueryRecommendationResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortfolioQueryRecommendationResultRepository extends JpaRepository<PortfolioQueryRecommendationResult, Long> {
    List<PortfolioQueryRecommendationResult> findAllByQueryHistory_IdOrderByIdAsc(Long queryId);
}
