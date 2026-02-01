package com.portmatch.domain.portfolio.embedding.repository;

import com.portmatch.domain.portfolio.embedding.entity.PortfolioUserArchitectureEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface PortfolioUserArchitectureEmbeddingRepository extends JpaRepository<PortfolioUserArchitectureEmbedding, Long> {

    @Modifying
    @Query(value = """
        DELETE FROM portfolio_user_architecture_embeddings
        WHERE portfolio_id = :portfolioId
        """, nativeQuery = true)
    void deleteByPortfolioId(Long portfolioId);

    @Modifying
    @Query(value = """
        INSERT INTO portfolio_user_architecture_embeddings
            (user_id, portfolio_id, architecture_text, embedding, created_at, updated_at)
        VALUES
            (:userId, :portfolioId, :architectureText, CAST(:embedding AS vector), NOW(), NOW())
        ON CONFLICT (portfolio_id, architecture_text)
        DO UPDATE SET
            embedding = EXCLUDED.embedding,
            updated_at = NOW()
        """, nativeQuery = true)
    void upsertArchitectureEmbedding(
            Long userId,
            Long portfolioId,
            String architectureText,
            String embedding
    );
}
