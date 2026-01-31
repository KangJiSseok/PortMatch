package com.portmatch.domain.portfolio.embedding.repository;

import com.portmatch.domain.portfolio.embedding.entity.PortfolioProjectTagEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PortfolioProjectTagEmbeddingRepository extends JpaRepository<PortfolioProjectTagEmbedding, Long> {

    Optional<PortfolioProjectTagEmbedding> findByProjectId(Long projectId);

    @Modifying
    @Query(value = """
        INSERT INTO portfolio_project_tag_embeddings
            (
                portfolio_id,
                analysis_id,
                project_id,
                content,
                content_hash,
                tech_embedding,
                keyword_embedding,
                architecture_embedding,
                tech_missing,
                keyword_missing,
                architecture_missing,
                created_at,
                updated_at
            )
        VALUES
            (
                :portfolioId,
                :analysisId,
                :projectId,
                :content,
                :contentHash,
                CAST(:techEmbedding AS vector),
                CAST(:keywordEmbedding AS vector),
                CAST(:architectureEmbedding AS vector),
                :techMissing,
                :keywordMissing,
                :architectureMissing,
                NOW(),
                NOW()
            )
        ON CONFLICT (project_id)
        DO UPDATE SET
            portfolio_id = EXCLUDED.portfolio_id,
            analysis_id = EXCLUDED.analysis_id,
            content = EXCLUDED.content,
            content_hash = EXCLUDED.content_hash,
            tech_embedding = EXCLUDED.tech_embedding,
            keyword_embedding = EXCLUDED.keyword_embedding,
            architecture_embedding = EXCLUDED.architecture_embedding,
            tech_missing = EXCLUDED.tech_missing,
            keyword_missing = EXCLUDED.keyword_missing,
            architecture_missing = EXCLUDED.architecture_missing,
            updated_at = NOW()
        """, nativeQuery = true)
    void upsertByProjectId(
            Long portfolioId,
            Long analysisId,
            Long projectId,
            String content,
            String contentHash,
            String techEmbedding,
            String keywordEmbedding,
            String architectureEmbedding,
            boolean techMissing,
            boolean keywordMissing,
            boolean architectureMissing
    );
}
