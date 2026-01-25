package com.portmatch.domain.companyproject.repository;

import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CompanyProjectAnalysisRepository extends JpaRepository<CompanyProjectAnalysis, Long> {

    Optional<CompanyProjectAnalysis> findByCompanyId(Long companyId);

    @Query("""
    select distinct a
    from CompanyProjectAnalysis a
    left join fetch a.projects p
    where a.id = :analysisId
""")
    Optional<CompanyProjectAnalysis> findByIdWithProjects(@Param("analysisId") Long analysisId);
}
