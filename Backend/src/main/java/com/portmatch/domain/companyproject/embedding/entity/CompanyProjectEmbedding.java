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

    @Column(name = "embedding", columnDefinition = "vector(1536)", nullable = false)
    private String embedding;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public CompanyProjectEmbedding(
            Long companyId,
            Long analysisId,
            Long projectId,
            String content,
            String embedding
    ) {
        this.companyId = companyId;
        this.analysisId = analysisId;
        this.projectId = projectId;
        this.content = content;
        this.embedding = embedding;
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

    public void update(String content, String embedding) {
        this.content = content;
        this.embedding = embedding;
    }
}
