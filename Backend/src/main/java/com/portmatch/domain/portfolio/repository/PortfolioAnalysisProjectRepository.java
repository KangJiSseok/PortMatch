package com.portmatch.domain.portfolio.repository;

import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PortfolioAnalysisProjectRepository extends JpaRepository<PortfolioAnalysisProject, Long> {

    @Query("""
        select distinct p
        from PortfolioAnalysisProject p
        left join fetch p.techs t
        join fetch p.analysis a
        join fetch a.portfolio pf
        join fetch pf.user u
        where p.id = :projectId
          and u.id = :userId
        """)
    Optional<PortfolioAnalysisProject> findByIdWithTechsAndUserId(
            @Param("projectId") Long projectId,
            @Param("userId") Long userId
    );
}
