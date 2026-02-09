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

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Column(name = "project_embedding", columnDefinition = "vector(1536)")
    private String projectEmbedding;

    @Column(name = "domain_embedding", columnDefinition = "vector(1536)")
    private String domainEmbedding;

    @Column(name = "problem_embedding", columnDefinition = "vector(1536)")
    private String problemEmbedding;

    @Column(name = "solution_embedding", columnDefinition = "vector(1536)")
    private String solutionEmbedding;

    @Column(name = "tech_embedding", columnDefinition = "vector(1536)")
    private String techEmbedding;

    @Column(name = "architecture_embedding", columnDefinition = "vector(1536)")
    private String architectureEmbedding;

    @Column(name = "problem_missing", nullable = false)
    private boolean problemMissing;

    @Column(name = "solution_missing", nullable = false)
    private boolean solutionMissing;

    @Column(name = "tech_missing", nullable = false)
    private boolean techMissing;

    @Column(name = "architecture_missing", nullable = false)
    private boolean architectureMissing;

    @Column(name = "keywords_missing", nullable = false)
    private boolean keywordsMissing;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PortfolioProjectEmbedding(
            Long portfolioId,
            Long analysisId,
            Long projectId,
            String content,
            String contentHash,
            String projectEmbedding,
            String domainEmbedding,
            String problemEmbedding,
            String solutionEmbedding,
            String techEmbedding,
            String architectureEmbedding,
            boolean problemMissing,
            boolean solutionMissing,
            boolean techMissing,
            boolean architectureMissing,
            boolean keywordsMissing
    ) {
        this.portfolioId = portfolioId;
        this.analysisId = analysisId;
        this.projectId = projectId;
        this.content = content;
        this.contentHash = contentHash;
        this.projectEmbedding = projectEmbedding;
        this.domainEmbedding = domainEmbedding;
        this.problemEmbedding = problemEmbedding;
        this.solutionEmbedding = solutionEmbedding;
        this.techEmbedding = techEmbedding;
        this.architectureEmbedding = architectureEmbedding;
        this.problemMissing = problemMissing;
        this.solutionMissing = solutionMissing;
        this.techMissing = techMissing;
        this.architectureMissing = architectureMissing;
        this.keywordsMissing = keywordsMissing;
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
