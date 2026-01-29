package com.portmatch.domain.companyproject.recommendation.repository;

import com.portmatch.domain.portfolio.embedding.entity.PortfolioProjectEmbedding;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CompanyRecommendationRepository extends Repository<PortfolioProjectEmbedding, Long> {

    @Query(value = """
        WITH scored_pairs AS (
            SELECT
                cpe.company_id AS company_id,
                ppe.project_id AS portfolio_project_id,
                cpe.project_id AS company_project_id,
                ppe.content AS portfolio_content,
                cpe.content AS company_content,
                (ppe.project_embedding <=> cpe.project_embedding) AS project_distance,
                (ppe.domain_embedding <=> cpe.domain_embedding) AS domain_distance,
                (ppe.problem_embedding <=> cpe.problem_embedding) AS problem_distance,
                (ppe.solution_embedding <=> cpe.solution_embedding) AS solution_distance,
                (ppe.tech_embedding <=> cpe.tech_embedding) AS tech_distance,
                (
                    CASE
                        WHEN ppe.problem_missing OR cpe.problem_missing THEN 1
                        ELSE 0
                    END
                    + CASE
                        WHEN ppe.solution_missing OR cpe.solution_missing THEN 1
                        ELSE 0
                    END
                    + CASE
                        WHEN ppe.tech_missing OR cpe.tech_missing THEN 1
                        ELSE 0
                    END
                ) AS missing_field_count,
                (
                    0.05 * (ppe.project_embedding <=> cpe.project_embedding)
                    + 0.40 * (ppe.domain_embedding <=> cpe.domain_embedding)
                    + 0.25 * (ppe.problem_embedding <=> cpe.problem_embedding)
                    + 0.25 * (ppe.solution_embedding <=> cpe.solution_embedding)
                    + 0.03 * (ppe.tech_embedding <=> cpe.tech_embedding)
                    + 0.02 * (
                        CASE
                            WHEN ppe.problem_missing OR cpe.problem_missing THEN 1
                            ELSE 0
                        END
                        + CASE
                            WHEN ppe.solution_missing OR cpe.solution_missing THEN 1
                            ELSE 0
                        END
                        + CASE
                            WHEN ppe.tech_missing OR cpe.tech_missing THEN 1
                            ELSE 0
                        END
                    )
                ) AS distance
            FROM portfolio_project_embeddings ppe
            JOIN company_project_embeddings cpe ON TRUE
            WHERE ppe.portfolio_id = :portfolioId
        ),
        ranked AS (
            SELECT
                sp.*,
                ROW_NUMBER() OVER (PARTITION BY sp.company_id ORDER BY sp.distance ASC) AS rn
            FROM scored_pairs sp
        )
        SELECT
            company_id AS companyId,
            distance,
            portfolio_project_id AS portfolioProjectId,
            company_project_id AS companyProjectId,
            portfolio_content AS portfolioContent,
            company_content AS companyContent,
            project_distance AS projectDistance,
            domain_distance AS domainDistance,
            problem_distance AS problemDistance,
            solution_distance AS solutionDistance,
            tech_distance AS techDistance
        FROM ranked
        WHERE rn = 1
        ORDER BY distance ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<CompanyRecommendationRow> findTopCompaniesByPortfolio(
            @Param("portfolioId") Long portfolioId,
            @Param("limit") int limit
    );
}
