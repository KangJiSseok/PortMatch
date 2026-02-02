package com.portmatch.domain.jobposting.embedding.repository;

import com.portmatch.domain.jobposting.embedding.entity.JobPostingEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobPostingEmbeddingRepository extends JpaRepository<JobPostingEmbedding, Long> {

    Optional<JobPostingEmbedding> findByJobPostingId(Long jobPostingId);

    boolean existsByJobPostingId(Long jobPostingId);

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
}
