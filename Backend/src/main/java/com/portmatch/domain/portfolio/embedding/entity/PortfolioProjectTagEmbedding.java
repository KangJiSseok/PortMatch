package com.portmatch.domain.portfolio.embedding.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "portfolio_project_tag_embeddings",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_portfolio_project_tag_embeddings_project_id",
                columnNames = "project_id"
        )
)
public class PortfolioProjectTagEmbedding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "portfolio_id", nullable = false)
    private Long portfolioId;

    @Column(name = "analysis_id", nullable = false)
    private Long analysisId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Column(name = "tech_embedding", columnDefinition = "vector(1536)")
    private String techEmbedding;

    @Column(name = "keyword_embedding", columnDefinition = "vector(1536)")
    private String keywordEmbedding;

    @Column(name = "architecture_embedding", columnDefinition = "vector(1536)")
    private String architectureEmbedding;

    @Column(name = "tech_missing", nullable = false)
    private boolean techMissing;

    @Column(name = "keyword_missing", nullable = false)
    private boolean keywordMissing;

    @Column(name = "architecture_missing", nullable = false)
    private boolean architectureMissing;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PortfolioProjectTagEmbedding(
            Long portfolioId,
            Long analysisId,
            Long projectId,
            String content,
            String contentHash,
            String techEmbedding,
            String keywordEmbedding,
            String architectureEmbedding,
            boolean techMissing,
            boolean keywordMissing,
            boolean architectureMissing
    ) {
        this.portfolioId = portfolioId;
        this.analysisId = analysisId;
        this.projectId = projectId;
        this.content = content;
        this.contentHash = contentHash;
        this.techEmbedding = techEmbedding;
        this.keywordEmbedding = keywordEmbedding;
        this.architectureEmbedding = architectureEmbedding;
        this.techMissing = techMissing;
        this.keywordMissing = keywordMissing;
        this.architectureMissing = architectureMissing;
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
