package com.portmatch.domain.portfolio.embedding.repository;

import com.portmatch.domain.portfolio.embedding.entity.PortfolioUserKeywordEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface PortfolioUserKeywordEmbeddingRepository extends JpaRepository<PortfolioUserKeywordEmbedding, Long> {

    @Modifying
    @Query(value = """
        DELETE FROM portfolio_user_keyword_embeddings
        WHERE portfolio_id = :portfolioId
        """, nativeQuery = true)
    void deleteByPortfolioId(Long portfolioId);

    @Modifying
    @Query(value = """
        INSERT INTO portfolio_user_keyword_embeddings
            (user_id, portfolio_id, keyword_text, embedding, created_at, updated_at)
        VALUES
            (:userId, :portfolioId, :keywordText, CAST(:embedding AS vector), NOW(), NOW())
        ON CONFLICT (portfolio_id, keyword_text)
        DO UPDATE SET
            embedding = EXCLUDED.embedding,
            updated_at = NOW()
        """, nativeQuery = true)
    void upsertKeywordEmbedding(
            Long userId,
            Long portfolioId,
            String keywordText,
            String embedding
    );
}
