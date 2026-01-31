package com.portmatch.domain.portfolio.embedding.repository;

import com.portmatch.domain.portfolio.embedding.entity.PortfolioUserTechEmbedding;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.util.List;

public interface PortfolioUserTagRecommendationRepository extends Repository<PortfolioUserTechEmbedding, Long> {

    @Query(value = """
        SELECT
            t.user_id AS userId,
            t.portfolio_id AS portfolioId,
            t.tech_similarity AS techSimilarity,
            t.keyword_similarity AS keywordSimilarity,
            t.architecture_similarity AS architectureSimilarity,
            t.similarity AS similarity
        FROM (
            SELECT
                pf.user_id,
                pf.id AS portfolio_id,
                COALESCE(tech.tech_similarity, 0) AS tech_similarity,
                COALESCE(keyword.keyword_similarity, 0) AS keyword_similarity,
                COALESCE(arch.architecture_similarity, 0) AS architecture_similarity,
                (
                    COALESCE(tech.tech_similarity, 0) * :techWeight
                  + COALESCE(keyword.keyword_similarity, 0) * :keywordWeight
                  + COALESCE(arch.architecture_similarity, 0) * :architectureWeight
                ) / (:techWeight + :keywordWeight + :architectureWeight) AS similarity,
                ROW_NUMBER() OVER (
                    PARTITION BY pf.user_id
                    ORDER BY (
                        COALESCE(tech.tech_similarity, 0) * :techWeight
                      + COALESCE(keyword.keyword_similarity, 0) * :keywordWeight
                      + COALESCE(arch.architecture_similarity, 0) * :architectureWeight
                    ) / (:techWeight + :keywordWeight + :architectureWeight) DESC
                ) AS rn
            FROM portfolios pf
            LEFT JOIN (
                SELECT portfolio_id, MAX(1 - (embedding <=> CAST(:techEmbedding AS vector))) AS tech_similarity
                FROM portfolio_user_tech_embeddings
                GROUP BY portfolio_id
            ) tech ON tech.portfolio_id = pf.id
            LEFT JOIN (
                SELECT portfolio_id, MAX(1 - (embedding <=> CAST(:keywordEmbedding AS vector))) AS keyword_similarity
                FROM portfolio_user_keyword_embeddings
                GROUP BY portfolio_id
            ) keyword ON keyword.portfolio_id = pf.id
            LEFT JOIN (
                SELECT portfolio_id, MAX(1 - (embedding <=> CAST(:architectureEmbedding AS vector))) AS architecture_similarity
                FROM portfolio_user_architecture_embeddings
                GROUP BY portfolio_id
            ) arch ON arch.portfolio_id = pf.id
        ) t
        WHERE t.rn = 1
        ORDER BY t.similarity DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<UserTagRecommendationRow> findTopUsersByQueryEmbedding(
            String techEmbedding,
            String keywordEmbedding,
            String architectureEmbedding,
            double techWeight,
            double keywordWeight,
            double architectureWeight,
            int limit
    );
}
