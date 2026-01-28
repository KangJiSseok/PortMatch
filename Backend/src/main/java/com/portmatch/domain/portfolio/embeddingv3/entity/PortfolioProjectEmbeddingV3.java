package com.portmatch.domain.portfolio.embeddingv3.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "portfolio_project_embeddings_v3",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_portfolio_project_embeddings_v3_project_id",
                columnNames = "project_id"
        )
)
public class PortfolioProjectEmbeddingV3 {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "portfolio_id", nullable = false)
    private Long portfolioId;

    @Column(name = "analysis_id", nullable = false)
    private Long analysisId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "project_name", columnDefinition = "TEXT", nullable = false)
    private String projectName;

    @Column(name = "problem", columnDefinition = "TEXT", nullable = false)
    private String problem;

    @Column(name = "solution", columnDefinition = "TEXT", nullable = false)
    private String solution;

    @Column(name = "techs", columnDefinition = "TEXT", nullable = false)
    private String techs;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "name_embedding", columnDefinition = "vector(1536)", nullable = false)
    private String nameEmbedding;

    @Column(name = "problem_embedding", columnDefinition = "vector(1536)", nullable = false)
    private String problemEmbedding;

    @Column(name = "solution_embedding", columnDefinition = "vector(1536)", nullable = false)
    private String solutionEmbedding;

    @Column(name = "tech_embedding", columnDefinition = "vector(1536)", nullable = false)
    private String techEmbedding;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PortfolioProjectEmbeddingV3(
            Long portfolioId,
            Long analysisId,
            Long projectId,
            String projectName,
            String problem,
            String solution,
            String techs,
            String content,
            String nameEmbedding,
            String problemEmbedding,
            String solutionEmbedding,
            String techEmbedding
    ) {
        this.portfolioId = portfolioId;
        this.analysisId = analysisId;
        this.projectId = projectId;
        this.projectName = projectName;
        this.problem = problem;
        this.solution = solution;
        this.techs = techs;
        this.content = content;
        this.nameEmbedding = nameEmbedding;
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

    public void update(
            String projectName,
            String problem,
            String solution,
            String techs,
            String content,
            String nameEmbedding,
            String problemEmbedding,
            String solutionEmbedding,
            String techEmbedding
    ) {
        this.projectName = projectName;
        this.problem = problem;
        this.solution = solution;
        this.techs = techs;
        this.content = content;
        this.nameEmbedding = nameEmbedding;
        this.problemEmbedding = problemEmbedding;
        this.solutionEmbedding = solutionEmbedding;
        this.techEmbedding = techEmbedding;
    }
}
