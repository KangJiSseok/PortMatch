package com.portmatch.domain.companyproject.embedding.repository;

import com.portmatch.domain.companyproject.embedding.entity.CompanyProjectEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface CompanyProjectEmbeddingRepository extends JpaRepository<CompanyProjectEmbedding, Long> {
    Optional<CompanyProjectEmbedding> findByProjectId(Long projectId);

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO company_project_embeddings
            (
                company_id,
                analysis_id,
                project_id,
                content,
                project_embedding,
                problem_embedding,
                solution_embedding,
                tech_embedding,
                created_at,
                updated_at
            )
        VALUES
            (
                :companyId,
                :analysisId,
                :projectId,
                :content,
                CAST(:projectEmbedding AS vector),
                CAST(:problemEmbedding AS vector),
                CAST(:solutionEmbedding AS vector),
                CAST(:techEmbedding AS vector),
                now(),
                now()
            )
        ON CONFLICT (project_id) DO UPDATE SET
            company_id = EXCLUDED.company_id,
            analysis_id = EXCLUDED.analysis_id,
            content = EXCLUDED.content,
            project_embedding = EXCLUDED.project_embedding,
            problem_embedding = EXCLUDED.problem_embedding,
            solution_embedding = EXCLUDED.solution_embedding,
            tech_embedding = EXCLUDED.tech_embedding,
            updated_at = now()
        """, nativeQuery = true)
    void upsertByProjectId(
            @Param("companyId") Long companyId,
            @Param("analysisId") Long analysisId,
            @Param("projectId") Long projectId,
            @Param("content") String content,
            @Param("projectEmbedding") String projectEmbedding,
            @Param("problemEmbedding") String problemEmbedding,
            @Param("solutionEmbedding") String solutionEmbedding,
            @Param("techEmbedding") String techEmbedding
    );

    @Query(value = """
    SELECT *, 1 - (project_embedding <=> CAST(:queryVector AS vector)) AS similarity
    FROM company_project_embeddings
    ORDER BY project_embedding <=> CAST(:queryVector AS vector)
    LIMIT :limit
    """, nativeQuery = true)
    List<Object[]> findSimilarProjects(
            @Param("queryVector") String queryVector,
            @Param("limit") int limit
    );
}
