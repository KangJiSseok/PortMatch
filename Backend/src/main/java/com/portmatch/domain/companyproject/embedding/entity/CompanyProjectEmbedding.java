package com.portmatch.domain.companyproject.embedding.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "company_project_embeddings",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_company_project_embeddings_project_id",
                columnNames = "project_id"
        )
)
public class CompanyProjectEmbedding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "analysis_id", nullable = false)
    private Long analysisId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "project_embedding", columnDefinition = "vector(1536)")
    private String projectEmbedding;

    @Column(name = "problem_embedding", columnDefinition = "vector(1536)")
    private String problemEmbedding;

    @Column(name = "solution_embedding", columnDefinition = "vector(1536)")
    private String solutionEmbedding;

    @Column(name = "tech_embedding", columnDefinition = "vector(1536)")
    private String techEmbedding;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public CompanyProjectEmbedding(
            Long companyId,
            Long analysisId,
            Long projectId,
            String content,
            String projectEmbedding,
            String problemEmbedding,
            String solutionEmbedding,
            String techEmbedding
    ) {
        this.companyId = companyId;
        this.analysisId = analysisId;
        this.projectId = projectId;
        this.content = content;
        this.projectEmbedding = projectEmbedding;
        this.problemEmbedding = problemEmbedding;
        this.solutionEmbedding = solutionEmbedding;
        this.techEmbedding = techEmbedding;
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void update(String content) {
        this.content = content;
    }
}
