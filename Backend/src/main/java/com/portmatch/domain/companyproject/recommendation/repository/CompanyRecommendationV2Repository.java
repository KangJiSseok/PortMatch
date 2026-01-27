package com.portmatch.domain.companyproject.recommendation.repository;

import com.portmatch.domain.portfolio.embeddingv2.entity.PortfolioProjectEmbeddingV2;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CompanyRecommendationV2Repository extends Repository<PortfolioProjectEmbeddingV2, Long> {

    @Query(value = """
        SELECT
            t.company_id AS companyId,
            t.company_project_id AS companyProjectId,
            t.company_content AS companyContent,
            t.portfolio_project_id AS portfolioProjectId,
            t.portfolio_content AS portfolioContent,
            t.distance AS distance
        FROM (
            SELECT
                cpe.company_id,
                cpe.project_id AS company_project_id,
                cpe.content AS company_content,
                ppe.project_id AS portfolio_project_id,
                ppe.content AS portfolio_content,
                (cpe.embedding <-> ppe.embedding) AS distance,
                ROW_NUMBER() OVER (
                    PARTITION BY cpe.company_id
                    ORDER BY (cpe.embedding <-> ppe.embedding) ASC
                ) AS rn
            FROM portfolio_project_embeddings_v2 ppe
            JOIN company_project_embeddings_v2 cpe ON TRUE
            WHERE ppe.portfolio_id = :portfolioId
        ) t
        WHERE t.rn = 1
        ORDER BY t.distance ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<CompanyRecommendationWithContentRow> findTopCompaniesByPortfolio(
            @Param("portfolioId") Long portfolioId,
            @Param("limit") int limit
    );
}
