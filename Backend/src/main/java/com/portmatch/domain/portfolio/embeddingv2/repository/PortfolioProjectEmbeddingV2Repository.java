package com.portmatch.domain.portfolio.embeddingv2.repository;

import com.portmatch.domain.portfolio.embeddingv2.entity.PortfolioProjectEmbeddingV2;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface PortfolioProjectEmbeddingV2Repository extends JpaRepository<PortfolioProjectEmbeddingV2, Long> {
    Optional<PortfolioProjectEmbeddingV2> findByProjectId(Long projectId);

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO portfolio_project_embeddings_v2
            (portfolio_id, analysis_id, project_id, content, embedding, created_at, updated_at)
        VALUES
            (:portfolioId, :analysisId, :projectId, :content, CAST(:embedding AS vector), now(), now())
        ON CONFLICT (project_id) DO UPDATE SET
            portfolio_id = EXCLUDED.portfolio_id,
            analysis_id = EXCLUDED.analysis_id,
            content = EXCLUDED.content,
            embedding = EXCLUDED.embedding,
            updated_at = now()
        """, nativeQuery = true)
    void upsertByProjectId(
            @Param("portfolioId") Long portfolioId,
            @Param("analysisId") Long analysisId,
            @Param("projectId") Long projectId,
            @Param("content") String content,
            @Param("embedding") String embedding
    );

    @Query(value = """
    SELECT *, 1 - (embedding <=> CAST(:queryVector AS vector)) AS similarity
    FROM portfolio_project_embeddings_v2
    ORDER BY embedding <=> CAST(:queryVector AS vector)
    LIMIT :limit
    """, nativeQuery = true)
    List<Object[]> findSimilarProjects(
            @Param("queryVector") String queryVector,
            @Param("limit") int limit
    );
}
