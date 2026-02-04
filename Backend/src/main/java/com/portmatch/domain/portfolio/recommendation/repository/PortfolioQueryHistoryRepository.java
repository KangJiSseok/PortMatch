package com.portmatch.domain.portfolio.recommendation.repository;

import com.portmatch.domain.portfolio.recommendation.entity.PortfolioQueryHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface PortfolioQueryHistoryRepository extends JpaRepository<PortfolioQueryHistory, Long> {
    Page<PortfolioQueryHistory> findAllByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<PortfolioQueryHistory> findByIdAndUser_Id(Long id, Long userId);
}
