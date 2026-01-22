package com.portmatch.domain.portfolio.embedding.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "portfolio_project_embeddings",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_portfolio_project_embeddings_project_id",
                columnNames = "project_id"
        )
)
public class PortfolioProjectEmbedding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "portfolio_id", nullable = false)
    private Long portfolioId;

    @Column(name = "analysis_id", nullable = false)
    private Long analysisId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(nullable = false, length = 128)
    private String model;

    @Column(nullable = false)
    private Integer dim;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Column(name = "embedding", columnDefinition = "vector(1536)", nullable = false)
    private String embedding;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PortfolioProjectEmbedding(
            Long portfolioId,
            Long analysisId,
            Long projectId,
            String model,
            Integer dim,
            String content,
            String contentHash,
            String embedding
    ) {
        this.portfolioId = portfolioId;
        this.analysisId = analysisId;
        this.projectId = projectId;
        this.model = model;
        this.dim = dim;
        this.content = content;
        this.contentHash = contentHash;
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
}
