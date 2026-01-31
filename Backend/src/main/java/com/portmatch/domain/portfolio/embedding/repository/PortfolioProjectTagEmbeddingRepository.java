package com.portmatch.domain.portfolio.embedding.repository;

import com.portmatch.domain.portfolio.embedding.entity.PortfolioProjectTagEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PortfolioProjectTagEmbeddingRepository extends JpaRepository<PortfolioProjectTagEmbedding, Long> {

    Optional<PortfolioProjectTagEmbedding> findByProjectId(Long projectId);

    @Modifying
    @Query(value = """
        DELETE FROM portfolio_project_tag_embeddings
        WHERE portfolio_id = :portfolioId
        """, nativeQuery = true)
    void deleteByPortfolioId(Long portfolioId);

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

    @Query(value = """
        SELECT
            t.user_id AS userId,
            t.portfolio_id AS portfolioId,
            t.project_id AS projectId,
            t.content AS content,
            t.tech_similarity AS techSimilarity,
            t.keyword_similarity AS keywordSimilarity,
            t.architecture_similarity AS architectureSimilarity,
            t.similarity AS similarity
        FROM (
            SELECT
                pf.user_id,
                pte.portfolio_id,
                pte.project_id,
                pte.content,
                (1 - (pte.tech_embedding <=> CAST(:techEmbedding AS vector))) AS tech_similarity,
                (1 - (pte.keyword_embedding <=> CAST(:keywordEmbedding AS vector))) AS keyword_similarity,
                (1 - (pte.architecture_embedding <=> CAST(:architectureEmbedding AS vector))) AS architecture_similarity,
                (
                    (1 - (pte.tech_embedding <=> CAST(:techEmbedding AS vector))) * :techWeight
                  + (1 - (pte.keyword_embedding <=> CAST(:keywordEmbedding AS vector))) * :keywordWeight
                  + (1 - (pte.architecture_embedding <=> CAST(:architectureEmbedding AS vector))) * :architectureWeight
                ) / (:techWeight + :keywordWeight + :architectureWeight) AS similarity,
                ROW_NUMBER() OVER (
                    PARTITION BY pf.user_id
                    ORDER BY (
                        (1 - (pte.tech_embedding <=> CAST(:techEmbedding AS vector))) * :techWeight
                      + (1 - (pte.keyword_embedding <=> CAST(:keywordEmbedding AS vector))) * :keywordWeight
                      + (1 - (pte.architecture_embedding <=> CAST(:architectureEmbedding AS vector))) * :architectureWeight
                    ) / (:techWeight + :keywordWeight + :architectureWeight) DESC
                ) AS rn
            FROM portfolio_project_tag_embeddings pte
            JOIN portfolios pf ON pf.id = pte.portfolio_id
        ) t
        WHERE t.rn = 1
        ORDER BY t.similarity DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<TagRecommendationRow> findTopUsersByQueryEmbedding(
            String techEmbedding,
            String keywordEmbedding,
            String architectureEmbedding,
            double techWeight,
            double keywordWeight,
            double architectureWeight,
            int limit
    );
}
