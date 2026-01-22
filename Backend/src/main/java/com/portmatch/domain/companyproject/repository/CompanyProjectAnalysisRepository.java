package com.portmatch.domain.companyproject.repository;

import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyProjectAnalysisRepository extends JpaRepository<CompanyProjectAnalysis, Long> {
    Optional<CompanyProjectAnalysis> findByCompanyId(Long companyId);
}
