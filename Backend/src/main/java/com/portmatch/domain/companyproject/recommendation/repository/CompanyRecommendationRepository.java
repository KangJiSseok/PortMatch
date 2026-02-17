package com.portmatch.domain.companyproject.recommendation.repository;

import com.portmatch.domain.portfolio.embedding.entity.PortfolioProjectEmbedding;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CompanyRecommendationRepository extends Repository<PortfolioProjectEmbedding, Long> {

    @Query(value = """
        WITH portfolio_projects AS MATERIALIZED (
            SELECT
                ppe.project_id,
                ppe.content,
                ppe.project_embedding,
                ppe.domain_embedding,
                ppe.problem_embedding,
                ppe.solution_embedding,
                ppe.tech_embedding,
                ppe.problem_missing,
                ppe.solution_missing,
                ppe.tech_missing
            FROM portfolio_project_embeddings ppe
            WHERE ppe.portfolio_id = :portfolioId
        ),
        project_candidates AS (
            SELECT
                cpe.company_id,
                pp.project_id AS portfolio_project_id,
                cpe.project_id AS company_project_id,
                (cpe.project_embedding <=> pp.project_embedding) AS seed_distance
            FROM portfolio_projects pp
            JOIN LATERAL (
                SELECT
                    cpe_inner.company_id,
                    cpe_inner.project_id,
                    cpe_inner.project_embedding
                FROM company_project_embeddings cpe_inner
                ORDER BY cpe_inner.project_embedding <=> pp.project_embedding ASC
                LIMIT 50
            ) cpe ON TRUE
        ),
        problem_candidates AS (
            SELECT
                cpe.company_id,
                pp.project_id AS portfolio_project_id,
                cpe.project_id AS company_project_id,
                (cpe.problem_embedding <=> pp.problem_embedding) AS seed_distance
            FROM portfolio_projects pp
            JOIN LATERAL (
                SELECT
                    cpe_inner.company_id,
                    cpe_inner.project_id,
                    cpe_inner.problem_embedding
                FROM company_project_embeddings cpe_inner
                ORDER BY cpe_inner.problem_embedding <=> pp.problem_embedding ASC
                LIMIT 50
            ) cpe ON TRUE
        ),
        solution_candidates AS (
            SELECT
                cpe.company_id,
                pp.project_id AS portfolio_project_id,
                cpe.project_id AS company_project_id,
                (cpe.solution_embedding <=> pp.solution_embedding) AS seed_distance
            FROM portfolio_projects pp
            JOIN LATERAL (
                SELECT
                    cpe_inner.company_id,
                    cpe_inner.project_id,
                    cpe_inner.solution_embedding
                FROM company_project_embeddings cpe_inner
                ORDER BY cpe_inner.solution_embedding <=> pp.solution_embedding ASC
                LIMIT 50
            ) cpe ON TRUE
        ),
        candidate_pairs AS (
            SELECT * FROM project_candidates
            UNION
            SELECT * FROM problem_candidates
            UNION
            SELECT * FROM solution_candidates
        ),
        top_candidates AS (
            SELECT
                cp.company_id,
                cp.portfolio_project_id,
                cp.company_project_id
            FROM candidate_pairs cp
            ORDER BY cp.seed_distance ASC
            LIMIT 150
        ),
        scored_pairs_base AS (
            SELECT
                cpe.company_id AS company_id,
                pp.project_id AS portfolio_project_id,
                cpe.project_id AS company_project_id,
                pp.content AS portfolio_content,
                cpe.content AS company_content,
                (pp.project_embedding <=> cpe.project_embedding) AS project_distance,
                (pp.domain_embedding <=> cpe.domain_embedding) AS domain_distance,
                (pp.problem_embedding <=> cpe.problem_embedding) AS problem_distance,
                (pp.solution_embedding <=> cpe.solution_embedding) AS solution_distance,
                (pp.tech_embedding <=> cpe.tech_embedding) AS tech_distance,
                (
                    CASE
                        WHEN pp.problem_missing OR cpe.problem_missing THEN 1
                        ELSE 0
                    END
                    + CASE
                        WHEN pp.solution_missing OR cpe.solution_missing THEN 1
                        ELSE 0
                    END
                    + CASE
                        WHEN pp.tech_missing OR cpe.tech_missing THEN 1
                        ELSE 0
                    END
                ) AS missing_field_count
            FROM top_candidates tc
            JOIN portfolio_projects pp ON pp.project_id = tc.portfolio_project_id
            JOIN company_project_embeddings cpe
              ON cpe.project_id = tc.company_project_id
             AND cpe.company_id = tc.company_id
        ),
        scored_pairs AS (
            SELECT
                spb.*,
                (
                    0.25 * spb.project_distance
                    + 0.05 * spb.domain_distance
                    + 0.25 * spb.problem_distance
                    + 0.25 * spb.solution_distance
                    + 0.1 * spb.tech_distance
                    + 0.1 * spb.missing_field_count
                ) AS distance
            FROM scored_pairs_base spb
        ),
        job_posting_counts AS MATERIALIZED (
            SELECT
                jp.cid,
                COUNT(*) AS job_posting_size
            FROM job_postings jp
            WHERE jp.active = 1
            GROUP BY jp.cid
        ),
        ranked AS (
            SELECT
                sp.*,
                ROW_NUMBER() OVER (PARTITION BY sp.company_id ORDER BY sp.distance ASC) AS rn
            FROM scored_pairs sp
        ),
        top_ranked AS (
            SELECT
                r.*
            FROM ranked r
            WHERE r.rn = 1
            ORDER BY r.distance ASC
            LIMIT :limit
        )
        SELECT
            company_id AS companyId,
            companies.companies_name As companyName,
            companies.cid AS cid,
            COALESCE(jpc.job_posting_size, 0) AS jobPostingSize,
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
        FROM top_ranked
        JOIN companies ON top_ranked.company_id=companies.id
        LEFT JOIN job_posting_counts jpc ON jpc.cid = companies.cid
        ORDER BY top_ranked.distance ASC
        """, nativeQuery = true)
    List<CompanyRecommendationRow> findTopCompaniesByPortfolio(
            @Param("portfolioId") Long portfolioId,
            @Param("limit") int limit
    );
}
