package com.portmatch.domain.companyproject.repository;

import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysisProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CompanyProjectAnalysisProjectRepository extends JpaRepository<CompanyProjectAnalysisProject, Long> {

    @Query("""
        select p
        from CompanyProjectAnalysisProject p
        left join fetch p.techs
        where p.id = :projectId
        """)
    Optional<CompanyProjectAnalysisProject> findByIdWithTechs(@Param("projectId") Long projectId);
}
