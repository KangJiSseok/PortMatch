package com.portmatch.domain.portfolio.embedding.repository;

import com.portmatch.domain.portfolio.embedding.entity.PortfolioUserJobPostingEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PortfolioUserJobPostingEmbeddingRepository extends JpaRepository<PortfolioUserJobPostingEmbedding, Long> {

    Optional<PortfolioUserJobPostingEmbedding> findByPortfolioId(Long portfolioId);

    boolean existsByPortfolioId(Long portfolioId);

    @Modifying
    @Query(value = """
        DELETE FROM portfolio_user_job_posting_embeddings
        WHERE portfolio_id = :portfolioId
        """, nativeQuery = true)
    void deleteByPortfolioId(Long portfolioId);

    @Modifying
    @Query(value = """
        INSERT INTO portfolio_user_job_posting_embeddings
            (
                user_id,
                portfolio_id,
                content,
                content_hash,
                name_embedding,
                domain_embedding,
                problem_embedding,
                tech_embedding,
                architecture_embedding,
                problem_missing,
                tech_missing,
                architecture_missing,
                created_at,
                updated_at
            )
        VALUES
            (
                :userId,
                :portfolioId,
                :content,
                :contentHash,
                CAST(:nameEmbedding AS vector),
                CAST(:domainEmbedding AS vector),
                CAST(:problemEmbedding AS vector),
                CAST(:techEmbedding AS vector),
                CAST(:architectureEmbedding AS vector),
                :problemMissing,
                :techMissing,
                :architectureMissing,
                NOW(),
                NOW()
            )
        ON CONFLICT (portfolio_id)
        DO UPDATE SET
            user_id = EXCLUDED.user_id,
            content = EXCLUDED.content,
            content_hash = EXCLUDED.content_hash,
            name_embedding = EXCLUDED.name_embedding,
            domain_embedding = EXCLUDED.domain_embedding,
            problem_embedding = EXCLUDED.problem_embedding,
            tech_embedding = EXCLUDED.tech_embedding,
            architecture_embedding = EXCLUDED.architecture_embedding,
            problem_missing = EXCLUDED.problem_missing,
            tech_missing = EXCLUDED.tech_missing,
            architecture_missing = EXCLUDED.architecture_missing,
            updated_at = NOW()
        """, nativeQuery = true)
    void upsertByPortfolioId(
            Long userId,
            Long portfolioId,
            String content,
            String contentHash,
            String nameEmbedding,
            String domainEmbedding,
            String problemEmbedding,
            String techEmbedding,
            String architectureEmbedding,
            boolean problemMissing,
            boolean techMissing,
            boolean architectureMissing
    );
}
