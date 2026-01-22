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
            (company_id, analysis_id, project_id, model, dim, content, embedding, created_at, updated_at)
        VALUES
            (:companyId, :analysisId, :projectId, :model, :dim, :content, CAST(:embedding AS vector), now(), now())
        ON CONFLICT (project_id) DO UPDATE SET
            company_id = EXCLUDED.company_id,
            analysis_id = EXCLUDED.analysis_id,
            model = EXCLUDED.model,
            dim = EXCLUDED.dim,
            content = EXCLUDED.content,
            embedding = EXCLUDED.embedding,
            updated_at = now()
        """, nativeQuery = true)
    void upsertByProjectId(
            @Param("companyId") Long companyId,
            @Param("analysisId") Long analysisId,
            @Param("projectId") Long projectId,
            @Param("model") String model,
            @Param("dim") Integer dim,
            @Param("content") String content,
            @Param("embedding") String embedding
    );

    @Query(value = """
    SELECT *, 1 - (embedding <=> CAST(:queryVector AS vector)) AS similarity
    FROM company_project_embeddings
    ORDER BY embedding <=> CAST(:queryVector AS vector)
    LIMIT :limit
    """, nativeQuery = true)
    List<Object[]> findSimilarProjects(
            @Param("queryVector") String queryVector,
            @Param("limit") int limit
    );
}
