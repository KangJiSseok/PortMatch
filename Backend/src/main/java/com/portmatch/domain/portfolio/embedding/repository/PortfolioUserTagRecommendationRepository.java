package com.portmatch.domain.portfolio.embedding.repository;

import com.portmatch.domain.portfolio.embedding.entity.PortfolioUserTechEmbedding;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.util.List;

public interface PortfolioUserTagRecommendationRepository extends Repository<PortfolioUserTechEmbedding, Long> {

    @Query(value = """
        SELECT
            t.user_id AS userId,
            t.user_name AS userName,
            t.portfolio_id AS portfolioId,
            t.tech_similarity AS techSimilarity,
            t.keyword_similarity AS keywordSimilarity,
            t.architecture_similarity AS architectureSimilarity,
            t.unified_similarity AS unifiedSimilarity,
            t.tech_text AS techText,
            t.keyword_text AS keywordText,
            t.architecture_text AS architectureText,
            t.unified_text AS unifiedText,
            t.similarity AS similarity
        FROM (
            SELECT
                pf.user_id,
                u.name AS user_name,
                pf.id AS portfolio_id,
                COALESCE(tech.tech_similarity, 0) AS tech_similarity,
                COALESCE(keyword.keyword_similarity, 0) AS keyword_similarity,
                COALESCE(arch.architecture_similarity, 0) AS architecture_similarity,
                COALESCE(unified.unified_similarity, 0) AS unified_similarity,
                tech.tech_text AS tech_text,
                keyword.keyword_text AS keyword_text,
                arch.architecture_text AS architecture_text,
                unified.unified_text AS unified_text,
                (
                    COALESCE(unified.unified_similarity, 0) * :unifiedWeight
                  + COALESCE(arch.architecture_similarity, 0) * :architectureWeight
                  + COALESCE(tech.tech_similarity, 0) * :techWeight
                ) / (:unifiedWeight + :architectureWeight + :techWeight) AS similarity,
                ROW_NUMBER() OVER (
                    PARTITION BY pf.user_id
                    ORDER BY (
                        COALESCE(unified.unified_similarity, 0) * :unifiedWeight
                      + COALESCE(arch.architecture_similarity, 0) * :architectureWeight
                      + COALESCE(tech.tech_similarity, 0) * :techWeight
                    ) / (:unifiedWeight + :architectureWeight + :techWeight) DESC
                ) AS rn
            FROM portfolios pf
            JOIN users u ON u.id = pf.user_id
            LEFT JOIN LATERAL (
                SELECT
                    tech_text,
                    1 - (embedding <=> CAST(:techEmbedding AS vector)) AS tech_similarity
                FROM portfolio_user_tech_embeddings
                WHERE portfolio_id = pf.id
                ORDER BY tech_similarity DESC
                LIMIT 1
            ) tech ON true
            LEFT JOIN LATERAL (
                SELECT
                    keyword_text,
                    1 - (embedding <=> CAST(:keywordEmbedding AS vector)) AS keyword_similarity
                FROM portfolio_user_keyword_embeddings
                WHERE portfolio_id = pf.id
                ORDER BY keyword_similarity DESC
                LIMIT 1
            ) keyword ON true
            LEFT JOIN LATERAL (
                SELECT
                    architecture_text,
                    1 - (embedding <=> CAST(:architectureEmbedding AS vector)) AS architecture_similarity
                FROM portfolio_user_architecture_embeddings
                WHERE portfolio_id = pf.id
                ORDER BY architecture_similarity DESC
                LIMIT 1
            ) arch ON true
            LEFT JOIN LATERAL (
                SELECT
                    unified_text,
                    1 - (embedding <=> CAST(:unifiedEmbedding AS vector)) AS unified_similarity
                FROM portfolio_user_unified_embeddings
                WHERE portfolio_id = pf.id
                LIMIT 1
            ) unified ON true
        ) t
        WHERE t.rn = 1
        ORDER BY t.similarity DESC
        LIMIT :limit
        """, nativeQuery = true)
    List<UserTagRecommendationRow> findTopUsersByQueryEmbedding(
            String techEmbedding,
            String keywordEmbedding,
            String architectureEmbedding,
            String unifiedEmbedding,
            double techWeight,
            double architectureWeight,
            double unifiedWeight,
            int limit
    );
}

