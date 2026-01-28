package com.portmatch.domain.portfolio.embeddingv3.repository;

import com.portmatch.domain.portfolio.embeddingv3.entity.PortfolioProjectEmbeddingV3;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface PortfolioProjectEmbeddingV3Repository extends JpaRepository<PortfolioProjectEmbeddingV3, Long> {
    Optional<PortfolioProjectEmbeddingV3> findByProjectId(Long projectId);

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO portfolio_project_embeddings_v3
            (portfolio_id, analysis_id, project_id, project_name, problem, solution, techs, content,
             name_embedding, problem_embedding, solution_embedding, tech_embedding, created_at, updated_at)
        VALUES
            (:portfolioId, :analysisId, :projectId, :projectName, :problem, :solution, :techs, :content,
             CAST(:nameEmbedding AS vector), CAST(:problemEmbedding AS vector),
             CAST(:solutionEmbedding AS vector), CAST(:techEmbedding AS vector), now(), now())
        ON CONFLICT (project_id) DO UPDATE SET
            portfolio_id = EXCLUDED.portfolio_id,
            analysis_id = EXCLUDED.analysis_id,
            project_name = EXCLUDED.project_name,
            problem = EXCLUDED.problem,
            solution = EXCLUDED.solution,
            techs = EXCLUDED.techs,
            content = EXCLUDED.content,
            name_embedding = EXCLUDED.name_embedding,
            problem_embedding = EXCLUDED.problem_embedding,
            solution_embedding = EXCLUDED.solution_embedding,
            tech_embedding = EXCLUDED.tech_embedding,
            updated_at = now()
        """, nativeQuery = true)
    void upsertByProjectId(
            @Param("portfolioId") Long portfolioId,
            @Param("analysisId") Long analysisId,
            @Param("projectId") Long projectId,
            @Param("projectName") String projectName,
            @Param("problem") String problem,
            @Param("solution") String solution,
            @Param("techs") String techs,
            @Param("content") String content,
            @Param("nameEmbedding") String nameEmbedding,
            @Param("problemEmbedding") String problemEmbedding,
            @Param("solutionEmbedding") String solutionEmbedding,
            @Param("techEmbedding") String techEmbedding
    );
}
