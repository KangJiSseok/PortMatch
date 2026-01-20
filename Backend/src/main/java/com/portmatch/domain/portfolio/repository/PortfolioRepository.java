package com.portmatch.domain.portfolio.repository;

import com.portmatch.domain.portfolio.entity.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {

    List<Portfolio> findAllByUserIdOrderByCreatedAtDesc(Long userId);
}
