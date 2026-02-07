package com.portmatch.domain.jobposting.embedding.repository;

import com.portmatch.domain.jobposting.embedding.entity.JobPostingEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobPostingEmbeddingRepository extends JpaRepository<JobPostingEmbedding, Long> {

    Optional<JobPostingEmbedding> findByJobPostingId(Long jobPostingId);

    boolean existsByJobPostingId(Long jobPostingId);
    List<JobPostingEmbedding> findAllByJobPostingIdIn(List<Long> jobPostingIds);

    @Modifying
    @Query(value = """
            INSERT INTO job_posting_embeddings (
                job_posting_id, name, domain, problem, solution, tech,
                architecture_experience, keywords, content, content_hash,
                name_embedding, domain_embedding, problem_embedding, solution_embedding,
                tech_embedding, architecture_embedding, keywords_embedding,
                problem_missing, solution_missing, tech_missing, architecture_missing, created_at, updated_at
            ) VALUES (
                :jobPostingId, :name, :domain, :problem, :solution, :tech,
                :architectureExperience, :keywords, :content, :contentHash,
                CAST(:nameEmbedding AS vector),
                CAST(:domainEmbedding AS vector),
                CAST(:problemEmbedding AS vector),
                CAST(:solutionEmbedding AS vector),
                CAST(:techEmbedding AS vector),
                CAST(:architectureEmbedding AS vector),
                CAST(:keywordsEmbedding AS vector),
                :problemMissing, :solutionMissing, :techMissing, :architectureMissing, NOW(), NOW()
            )
            ON CONFLICT (job_posting_id) DO UPDATE SET
                name = EXCLUDED.name,
                domain = EXCLUDED.domain,
                problem = EXCLUDED.problem,
                solution = EXCLUDED.solution,
                tech = EXCLUDED.tech,
                architecture_experience = EXCLUDED.architecture_experience,
                keywords = EXCLUDED.keywords,
                content = EXCLUDED.content,
                content_hash = EXCLUDED.content_hash,
                name_embedding = EXCLUDED.name_embedding,
                domain_embedding = EXCLUDED.domain_embedding,
                problem_embedding = EXCLUDED.problem_embedding,
                solution_embedding = EXCLUDED.solution_embedding,
                tech_embedding = EXCLUDED.tech_embedding,
                architecture_embedding = EXCLUDED.architecture_embedding,
                keywords_embedding = EXCLUDED.keywords_embedding,
                problem_missing = EXCLUDED.problem_missing,
                solution_missing = EXCLUDED.solution_missing,
                tech_missing = EXCLUDED.tech_missing,
                architecture_missing = EXCLUDED.architecture_missing,
                updated_at = NOW()
            """, nativeQuery = true)
    void upsertByJobPostingId(
            @Param("jobPostingId") Long jobPostingId,
            @Param("name") String name,
            @Param("domain") String domain,
            @Param("problem") String problem,
            @Param("solution") String solution,
            @Param("tech") String tech,
            @Param("architectureExperience") String architectureExperience,
            @Param("keywords") String keywords,
            @Param("content") String content,
            @Param("contentHash") String contentHash,
            @Param("nameEmbedding") String nameEmbedding,
            @Param("domainEmbedding") String domainEmbedding,
            @Param("problemEmbedding") String problemEmbedding,
            @Param("solutionEmbedding") String solutionEmbedding,
            @Param("techEmbedding") String techEmbedding,
            @Param("architectureEmbedding") String architectureEmbedding,
            @Param("keywordsEmbedding") String keywordsEmbedding,
            @Param("problemMissing") boolean problemMissing,
            @Param("solutionMissing") boolean solutionMissing,
            @Param("techMissing") boolean techMissing,
            @Param("architectureMissing") boolean architectureMissing
    );

    /**
     * 임베딩이 있는 공고만 조회
     */
    @Query("SELECT j FROM JobPostingEmbedding j WHERE j.nameEmbedding IS NOT NULL")
    List<JobPostingEmbedding> findAllWithEmbeddings();

    /**
     * 임베딩이 누락된 공고 조회 (임베딩 생성 대상)
     */
    @Query("SELECT j FROM JobPostingEmbedding j WHERE j.nameEmbedding IS NULL")
    List<JobPostingEmbedding> findAllWithoutEmbeddings();

    /**
     * 도메인 유사도 검색 (Native Query with pgvector)
     * 낮은 값일수록 유사함 (cosine distance)
     */
    @Query(value = """
            SELECT jpe.* FROM job_posting_embeddings jpe
            WHERE jpe.domain_embedding IS NOT NULL
            ORDER BY jpe.domain_embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
            """, nativeQuery = true)
    List<JobPostingEmbedding> findSimilarByDomain(
            @Param("embedding") String embedding,
            @Param("limit") int limit
    );

    /**
     * 기술 스택 유사도 검색
     */
    @Query(value = """
            SELECT jpe.* FROM job_posting_embeddings jpe
            WHERE jpe.tech_embedding IS NOT NULL
            ORDER BY jpe.tech_embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
            """, nativeQuery = true)
    List<JobPostingEmbedding> findSimilarByTech(
            @Param("embedding") String embedding,
            @Param("limit") int limit
    );

    /**
     * 문제/해결책 유사도 검색
     */
    @Query(value = """
            SELECT jpe.* FROM job_posting_embeddings jpe
            WHERE jpe.problem_embedding IS NOT NULL AND jpe.solution_embedding IS NOT NULL
            ORDER BY (jpe.problem_embedding <=> CAST(:problemEmbedding AS vector)) 
                   + (jpe.solution_embedding <=> CAST(:solutionEmbedding AS vector))
            LIMIT :limit
            """, nativeQuery = true)
    List<JobPostingEmbedding> findSimilarByProblemSolution(
            @Param("problemEmbedding") String problemEmbedding,
            @Param("solutionEmbedding") String solutionEmbedding,
            @Param("limit") int limit
    );

    /**
     * 통합 유사도 검색 (가중 평균)
     */
    @Query(value = """
            SELECT jpe.* FROM job_posting_embeddings jpe
            WHERE jpe.domain_embedding IS NOT NULL
              AND jpe.tech_embedding IS NOT NULL
              AND jpe.problem_embedding IS NOT NULL
            ORDER BY (
                0.2 * (jpe.domain_embedding <=> CAST(:domainEmbedding AS vector)) +
                0.3 * (jpe.tech_embedding <=> CAST(:techEmbedding AS vector)) +
                0.25 * (jpe.problem_embedding <=> CAST(:problemEmbedding AS vector)) +
                0.25 * (jpe.solution_embedding <=> CAST(:solutionEmbedding AS vector))
            )
            LIMIT :limit
            """, nativeQuery = true)
    List<JobPostingEmbedding> findSimilarJobPostings(
            @Param("domainEmbedding") String domainEmbedding,
            @Param("techEmbedding") String techEmbedding,
            @Param("problemEmbedding") String problemEmbedding,
            @Param("solutionEmbedding") String solutionEmbedding,
            @Param("limit") int limit
    );

    @Query(value = """
            SELECT jpe.job_posting_id
            FROM job_posting_embeddings jpe
            JOIN portfolio_user_job_posting_embeddings pue
                ON pue.portfolio_id = :portfolioId
            WHERE jpe.name_embedding IS NOT NULL
            ORDER BY (
                COALESCE(1 - (pue.name_embedding <=> jpe.name_embedding), 0) * :nameWeight
              + COALESCE(1 - (pue.domain_embedding <=> jpe.domain_embedding), 0) * :domainWeight
              + COALESCE(1 - (pue.tech_embedding <=> jpe.tech_embedding), 0)
                * :techWeight
                * CASE
                    WHEN (pue.tech_missing OR jpe.tech_missing) THEN :techMissingPenalty
                    ELSE 1
                  END
              + COALESCE(1 - (pue.problem_embedding <=> jpe.problem_embedding), 0)
                * :problemWeight
                * CASE
                    WHEN (pue.problem_missing OR jpe.problem_missing) THEN :problemMissingPenalty
                    ELSE 1
                  END
              + COALESCE(1 - (pue.architecture_embedding <=> jpe.architecture_embedding), 0)
                * :architectureWeight
                * CASE
                    WHEN (pue.architecture_missing OR jpe.architecture_missing) THEN :architectureMissingPenalty
                    ELSE 1
                  END
            ) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Long> findTopCandidateJobPostingIdsByPortfolioId(
            @Param("portfolioId") Long portfolioId,
            @Param("nameWeight") double nameWeight,
            @Param("domainWeight") double domainWeight,
            @Param("techWeight") double techWeight,
            @Param("problemWeight") double problemWeight,
            @Param("architectureWeight") double architectureWeight,
            @Param("techMissingPenalty") double techMissingPenalty,
            @Param("problemMissingPenalty") double problemMissingPenalty,
            @Param("architectureMissingPenalty") double architectureMissingPenalty,
            @Param("limit") int limit
    );

    @Query(value = """
            SELECT
                jpe.job_posting_id AS jobPostingId,
                (
                    COALESCE(s.name_similarity, 0) * :nameWeight
                  + COALESCE(s.domain_similarity, 0) * :domainWeight
                  + COALESCE(
                        CASE
                            WHEN (jpe.tech_missing OR s.tech_missing) THEN s.tech_similarity * :techMissingPenalty
                            ELSE s.tech_similarity
                        END,
                        0
                    ) * :techWeight
                  + COALESCE(
                        CASE
                            WHEN (jpe.problem_missing OR s.problem_missing) THEN s.problem_similarity * :problemMissingPenalty
                            ELSE s.problem_similarity
                        END,
                        0
                    ) * :problemWeight
                  + COALESCE(
                        CASE
                            WHEN (jpe.architecture_missing OR s.architecture_missing) THEN s.architecture_similarity * :architectureMissingPenalty
                            ELSE s.architecture_similarity
                        END,
                        0
                    ) * :architectureWeight
                ) AS similarity,
                COALESCE(s.name_similarity, 0) AS nameSimilarity,
                COALESCE(s.domain_similarity, 0) AS domainSimilarity,
                COALESCE(
                    CASE
                        WHEN (jpe.tech_missing OR s.tech_missing) THEN s.tech_similarity * :techMissingPenalty
                        ELSE s.tech_similarity
                    END,
                    0
                ) AS techSimilarity,
                COALESCE(
                    CASE
                        WHEN (jpe.problem_missing OR s.problem_missing) THEN s.problem_similarity * :problemMissingPenalty
                        ELSE s.problem_similarity
                    END,
                    0
                ) AS problemSimilarity,
                COALESCE(
                    CASE
                        WHEN (jpe.architecture_missing OR s.architecture_missing) THEN s.architecture_similarity * :architectureMissingPenalty
                        ELSE s.architecture_similarity
                    END,
                    0
                ) AS architectureSimilarity,
                s.portfolio_content AS portfolioContent
            FROM job_posting_embeddings jpe
            JOIN LATERAL (
                SELECT
                    MAX(COALESCE(1 - (ppe.project_embedding <=> jpe.name_embedding), 0)) AS name_similarity,
                    MAX(COALESCE(1 - (ppe.domain_embedding <=> jpe.domain_embedding), 0)) AS domain_similarity,
                    MAX(COALESCE(1 - (ppe.tech_embedding <=> jpe.tech_embedding), 0)) AS tech_similarity,
                    MAX(COALESCE(1 - (ppe.problem_embedding <=> jpe.problem_embedding), 0)) AS problem_similarity,
                    MAX(COALESCE(1 - (ppe.architecture_embedding <=> jpe.architecture_embedding), 0)) AS architecture_similarity,
                    BOOL_OR(ppe.tech_missing) AS tech_missing,
                    BOOL_OR(ppe.problem_missing) AS problem_missing,
                    BOOL_OR(ppe.architecture_missing) AS architecture_missing,
                    (
                        SELECT ppe2.content
                        FROM portfolio_project_embeddings ppe2
                        WHERE ppe2.portfolio_id = :portfolioId
                        ORDER BY (
                            COALESCE(1 - (ppe2.project_embedding <=> jpe.name_embedding), 0) * :nameWeight
                          + COALESCE(1 - (ppe2.domain_embedding <=> jpe.domain_embedding), 0) * :domainWeight
                          + COALESCE(1 - (ppe2.tech_embedding <=> jpe.tech_embedding), 0)
                            * :techWeight
                            * CASE
                                WHEN (ppe2.tech_missing OR jpe.tech_missing) THEN :techMissingPenalty
                                ELSE 1
                              END
                          + COALESCE(1 - (ppe2.problem_embedding <=> jpe.problem_embedding), 0)
                            * :problemWeight
                            * CASE
                                WHEN (ppe2.problem_missing OR jpe.problem_missing) THEN :problemMissingPenalty
                                ELSE 1
                              END
                          + COALESCE(1 - (ppe2.architecture_embedding <=> jpe.architecture_embedding), 0)
                            * :architectureWeight
                            * CASE
                                WHEN (ppe2.architecture_missing OR jpe.architecture_missing) THEN :architectureMissingPenalty
                                ELSE 1
                              END
                        ) DESC
                        LIMIT 1
                    ) AS portfolio_content
                FROM portfolio_project_embeddings ppe
                WHERE ppe.portfolio_id = :portfolioId
            ) s ON true
            WHERE jpe.job_posting_id IN (:jobPostingIds)
            ORDER BY similarity DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<JobPostingMatchRow> findRefinedMatchesByPortfolioIdAndJobPostingIds(
            @Param("portfolioId") Long portfolioId,
            @Param("jobPostingIds") List<Long> jobPostingIds,
            @Param("nameWeight") double nameWeight,
            @Param("domainWeight") double domainWeight,
            @Param("techWeight") double techWeight,
            @Param("problemWeight") double problemWeight,
            @Param("architectureWeight") double architectureWeight,
            @Param("techMissingPenalty") double techMissingPenalty,
            @Param("problemMissingPenalty") double problemMissingPenalty,
            @Param("architectureMissingPenalty") double architectureMissingPenalty,
            @Param("limit") int limit
    );
}
