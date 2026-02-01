package com.portmatch.domain.portfolio.embedding.repository;

import com.portmatch.domain.portfolio.embedding.entity.PortfolioUserUnifiedEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PortfolioUserUnifiedEmbeddingRepository extends JpaRepository<PortfolioUserUnifiedEmbedding, Long> {

    Optional<PortfolioUserUnifiedEmbedding> findByPortfolioId(Long portfolioId);

    @Modifying
    @Query("DELETE FROM PortfolioUserUnifiedEmbedding e WHERE e.portfolioId = :portfolioId")
    void deleteByPortfolioId(Long portfolioId);

    @Modifying
    @Query(value = """
        INSERT INTO portfolio_user_unified_embeddings (user_id, portfolio_id, unified_text, embedding, created_at, updated_at)
        VALUES (:userId, :portfolioId, :unifiedText, CAST(:embedding AS vector), NOW(), NOW())
        ON CONFLICT (portfolio_id)
        DO UPDATE SET
            unified_text = EXCLUDED.unified_text,
            embedding = EXCLUDED.embedding,
            updated_at = NOW()
        """, nativeQuery = true)
    void upsertUnifiedEmbedding(Long userId, Long portfolioId, String unifiedText, String embedding);
}
