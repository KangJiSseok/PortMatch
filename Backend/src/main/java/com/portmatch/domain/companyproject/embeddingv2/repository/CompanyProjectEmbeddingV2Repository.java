package com.portmatch.domain.companyproject.embeddingv2.repository;

import com.portmatch.domain.companyproject.embeddingv2.entity.CompanyProjectEmbeddingV2;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface CompanyProjectEmbeddingV2Repository extends JpaRepository<CompanyProjectEmbeddingV2, Long> {
    Optional<CompanyProjectEmbeddingV2> findByProjectId(Long projectId);

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO company_project_embeddings_v2
            (company_id, analysis_id, project_id, content, embedding, created_at, updated_at)
        VALUES
            (:companyId, :analysisId, :projectId, :content, CAST(:embedding AS vector), now(), now())
        ON CONFLICT (project_id) DO UPDATE SET
            company_id = EXCLUDED.company_id,
            analysis_id = EXCLUDED.analysis_id,
            content = EXCLUDED.content,
            embedding = EXCLUDED.embedding,
            updated_at = now()
        """, nativeQuery = true)
    void upsertByProjectId(
            @Param("companyId") Long companyId,
            @Param("analysisId") Long analysisId,
            @Param("projectId") Long projectId,
            @Param("content") String content,
            @Param("embedding") String embedding
    );

    @Query(value = """
    SELECT *, 1 - (embedding <=> CAST(:queryVector AS vector)) AS similarity
    FROM company_project_embeddings_v2
    ORDER BY embedding <=> CAST(:queryVector AS vector)
    LIMIT :limit
    """, nativeQuery = true)
    List<Object[]> findSimilarProjects(
            @Param("queryVector") String queryVector,
            @Param("limit") int limit
    );
}
