package com.portmatch.domain.portfolio.embedding.repository;

import com.portmatch.domain.portfolio.embedding.entity.PortfolioProjectEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PortfolioProjectEmbeddingRepository extends JpaRepository<PortfolioProjectEmbedding, Long> {

    Optional<PortfolioProjectEmbedding> findByProjectId(Long projectId);

    @Modifying
    @Query(value = """
        INSERT INTO portfolio_project_embeddings
            (portfolio_id, analysis_id, project_id, model, dim, content, content_hash, embedding, created_at, updated_at)
        VALUES
            (:portfolioId, :analysisId, :projectId, :model, :dim, :content, :contentHash, :embedding, NOW(), NOW())
        ON CONFLICT (project_id)
        DO UPDATE SET
            portfolio_id = EXCLUDED.portfolio_id,
            analysis_id = EXCLUDED.analysis_id,
            model = EXCLUDED.model,
            dim = EXCLUDED.dim,
            content = EXCLUDED.content,
            content_hash = EXCLUDED.content_hash,
            embedding = EXCLUDED.embedding,
            updated_at = NOW()
        """, nativeQuery = true)
    void upsertByProjectId(
            Long portfolioId,
            Long analysisId,
            Long projectId,
            String model,
            Integer dim,
            String content,
            String contentHash,
            String embedding
    );
}
