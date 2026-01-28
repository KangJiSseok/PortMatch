package com.portmatch.domain.companyproject.recommendation.repository;

import com.portmatch.domain.portfolio.embeddingv3.entity.PortfolioProjectEmbeddingV3;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CompanyRecommendationV3Repository extends Repository<PortfolioProjectEmbeddingV3, Long> {

    @Query(value = """
        SELECT
            t.company_id AS companyId,
            t.company_project_id AS companyProjectId,
            t.company_content AS companyContent,
            t.portfolio_project_id AS portfolioProjectId,
            t.portfolio_content AS portfolioContent,
            t.name_similarity AS nameSimilarity,
            t.problem_similarity AS problemSimilarity,
            t.solution_similarity AS solutionSimilarity,
            t.tech_similarity AS techSimilarity,
            t.similarity AS similarity
        FROM (
            SELECT
                cpe.company_id,
                cpe.project_id AS company_project_id,
                cpe.content AS company_content,
                ppe.project_id AS portfolio_project_id,
                ppe.content AS portfolio_content,
                (1 - (cpe.name_embedding <=> ppe.name_embedding)) AS name_similarity,
                (1 - (cpe.problem_embedding <=> ppe.problem_embedding)) AS problem_similarity,
                (1 - (cpe.solution_embedding <=> ppe.solution_embedding)) AS solution_similarity,
                (1 - (cpe.tech_embedding <=> ppe.tech_embedding)) AS tech_similarity,
                (
                    (1 - (cpe.name_embedding <=> ppe.name_embedding))
                  + (1 - (cpe.problem_embedding <=> ppe.problem_embedding))
                  + (1 - (cpe.solution_embedding <=> ppe.solution_embedding))
                  + (1 - (cpe.tech_embedding <=> ppe.tech_embedding))
                ) / 4.0 AS similarity,
                ROW_NUMBER() OVER (
                    PARTITION BY cpe.company_id
                    ORDER BY (
                        (1 - (cpe.name_embedding <=> ppe.name_embedding))
                      + (1 - (cpe.problem_embedding <=> ppe.problem_embedding))
                      + (1 - (cpe.solution_embedding <=> ppe.solution_embedding))
                      + (1 - (cpe.tech_embedding <=> ppe.tech_embedding))
                    ) / 4.0 DESC
                ) AS rn
            FROM portfolio_project_embeddings_v3 ppe
            JOIN company_project_embeddings_v3 cpe ON TRUE
            WHERE ppe.portfolio_id = :portfolioId
        ) t
        WHERE t.rn = 1
        ORDER BY t.similarity DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<CompanyRecommendationV3Row> findTopCompaniesByPortfolio(
            @Param("portfolioId") Long portfolioId,
            @Param("limit") int limit
    );
}
