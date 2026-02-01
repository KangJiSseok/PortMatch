package com.portmatch.domain.portfolio.embedding.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "portfolio_user_unified_embeddings",
        indexes = {
                @Index(name = "idx_portfolio_user_unified_embeddings_user_id", columnList = "user_id"),
                @Index(name = "idx_portfolio_user_unified_embeddings_portfolio_id", columnList = "portfolio_id")
        },
        uniqueConstraints = @UniqueConstraint(
                name = "uk_portfolio_user_unified_embeddings_portfolio",
                columnNames = {"portfolio_id"}
        )
)
public class PortfolioUserUnifiedEmbedding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "portfolio_id", nullable = false)
    private Long portfolioId;

    @Column(name = "unified_text", nullable = false, length = 4000)
    private String unifiedText;

    @Column(name = "embedding", columnDefinition = "vector(1536)")
    private String embedding;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PortfolioUserUnifiedEmbedding(
            Long userId,
            Long portfolioId,
            String unifiedText,
            String embedding
    ) {
        this.userId = userId;
        this.portfolioId = portfolioId;
        this.unifiedText = unifiedText;
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
