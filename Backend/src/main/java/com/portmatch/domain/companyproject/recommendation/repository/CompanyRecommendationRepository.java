package com.portmatch.domain.companyproject.recommendation.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CompanyRecommendationRepository extends Repository<Object, Long> {

    @Query(value = """
        SELECT
            cpe.company_id AS companyId,
            MIN(cpe.embedding <-> ppe.embedding) AS distance
        FROM portfolio_project_embeddings ppe
        JOIN company_project_embeddings cpe ON TRUE
        WHERE ppe.portfolio_id = :portfolioId
        GROUP BY cpe.company_id
        ORDER BY distance ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<CompanyRecommendationRow> findTopCompaniesByPortfolio(
            @Param("portfolioId") Long portfolioId,
            @Param("limit") int limit
    );
}
