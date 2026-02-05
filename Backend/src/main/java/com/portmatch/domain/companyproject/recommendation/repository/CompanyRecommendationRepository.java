package com.portmatch.domain.companyproject.recommendation.repository;

import com.portmatch.domain.portfolio.embedding.entity.PortfolioProjectEmbedding;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CompanyRecommendationRepository extends Repository<PortfolioProjectEmbedding, Long> {

    @Query(value = """
        WITH scored_pairs_base AS (
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
                ) AS missing_field_count
            FROM portfolio_project_embeddings ppe
            JOIN company_project_embeddings cpe ON TRUE
            WHERE ppe.portfolio_id = :portfolioId
        ),
        scored_pairs AS (
            SELECT
                spb.*,
                (
                    0.30 * spb.project_distance
                    + 0.10 * spb.domain_distance
                    + 0.25 * spb.problem_distance
                    + 0.25 * spb.solution_distance
                    + 0.03 * spb.tech_distance
                    + 0.02 * spb.missing_field_count
                ) AS distance
            FROM scored_pairs_base spb
        ),
        ranked AS (
            SELECT
                sp.*,
                ROW_NUMBER() OVER (PARTITION BY sp.company_id ORDER BY sp.distance ASC) AS rn
            FROM scored_pairs sp
        )
        SELECT
            company_id AS companyId,
            companies.companies_name As companyName,
            (
                SELECT COUNT(*)
                FROM job_postings jp
                WHERE jp.cid = companies.cid
                  AND jp.active = 1
            ) AS jobPostingSize,
            distance,
            portfolio_project_id AS portfolioProjectId,
            company_project_id AS companyProjectId,
            portfolio_content AS portfolioContent,
            company_content AS companyContent,
            (1 - project_distance) AS projectSimilarity,
            (1 - domain_distance) AS domainSimilarity,
            (1 - problem_distance) AS problemSimilarity,
            (1 - solution_distance) AS solutionSimilarity,
            (1 - tech_distance) AS techSimilarity
        FROM ranked JOIN companies ON ranked.company_id=companies.id
        WHERE rn = 1
        ORDER BY distance ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<CompanyRecommendationRow> findTopCompaniesByPortfolio(
            @Param("portfolioId") Long portfolioId,
            @Param("limit") int limit
    );
}
