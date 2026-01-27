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
            (
                portfolio_id,
                analysis_id,
                project_id,
                content,
                content_hash,
                project_embedding,
                problem_embedding,
                solution_embedding,
                tech_embedding,
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
                CAST(:projectEmbedding AS vector),
                CAST(:problemEmbedding AS vector),
                CAST(:solutionEmbedding AS vector),
                CAST(:techEmbedding AS vector),
                NOW(),
                NOW()
            )
        ON CONFLICT (project_id)
        DO UPDATE SET
            portfolio_id = EXCLUDED.portfolio_id,
            analysis_id = EXCLUDED.analysis_id,
            content = EXCLUDED.content,
            content_hash = EXCLUDED.content_hash,
            project_embedding = EXCLUDED.project_embedding,
            problem_embedding = EXCLUDED.problem_embedding,
            solution_embedding = EXCLUDED.solution_embedding,
            tech_embedding = EXCLUDED.tech_embedding,
            updated_at = NOW()
        """, nativeQuery = true)
    void upsertByProjectId(
            Long portfolioId,
            Long analysisId,
            Long projectId,
            String content,
            String contentHash,
            String projectEmbedding,
            String problemEmbedding,
            String solutionEmbedding,
            String techEmbedding
    );
}
