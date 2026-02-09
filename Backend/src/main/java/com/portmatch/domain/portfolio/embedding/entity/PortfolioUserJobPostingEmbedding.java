package com.portmatch.domain.portfolio.embedding.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "portfolio_user_job_posting_embeddings",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_portfolio_user_job_posting_embeddings_portfolio",
                columnNames = "portfolio_id"
        ),
        indexes = {
                @Index(name = "idx_portfolio_user_job_posting_embeddings_user_id", columnList = "user_id"),
                @Index(name = "idx_portfolio_user_job_posting_embeddings_portfolio_id", columnList = "portfolio_id")
        }
)
public class PortfolioUserJobPostingEmbedding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "portfolio_id", nullable = false)
    private Long portfolioId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Column(name = "name_embedding", columnDefinition = "vector(1536)")
    private String nameEmbedding;

    @Column(name = "domain_embedding", columnDefinition = "vector(1536)")
    private String domainEmbedding;

    @Column(name = "problem_embedding", columnDefinition = "vector(1536)")
    private String problemEmbedding;

    @Column(name = "tech_embedding", columnDefinition = "vector(1536)")
    private String techEmbedding;

    @Column(name = "architecture_embedding", columnDefinition = "vector(1536)")
    private String architectureEmbedding;

    @Column(name = "problem_missing", nullable = false)
    private boolean problemMissing;

    @Column(name = "tech_missing", nullable = false)
    private boolean techMissing;

    @Column(name = "architecture_missing", nullable = false)
    private boolean architectureMissing;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PortfolioUserJobPostingEmbedding(
            Long userId,
            Long portfolioId,
            String content,
            String contentHash,
            String nameEmbedding,
            String domainEmbedding,
            String problemEmbedding,
            String techEmbedding,
            String architectureEmbedding,
            boolean problemMissing,
            boolean techMissing,
            boolean architectureMissing
    ) {
        this.userId = userId;
        this.portfolioId = portfolioId;
        this.content = content;
        this.contentHash = contentHash;
        this.nameEmbedding = nameEmbedding;
        this.domainEmbedding = domainEmbedding;
        this.problemEmbedding = problemEmbedding;
        this.techEmbedding = techEmbedding;
        this.architectureEmbedding = architectureEmbedding;
        this.problemMissing = problemMissing;
        this.techMissing = techMissing;
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
