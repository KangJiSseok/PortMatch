package com.portmatch.domain.portfolio.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "portfolio_analyses",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_portfolio_analyses_portfolio_id", columnNames = "portfolio_id")
        }
)
public class PortfolioAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "portfolio_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_portfolio_analyses_portfolio")
    )
    private Portfolio portfolio;

    @OneToMany(mappedBy = "analysis", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<PortfolioAnalysisProject> projects = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public PortfolioAnalysis(Portfolio portfolio) {
        this.portfolio = portfolio;
    }

    public void replaceProjects(List<PortfolioAnalysisProject> newProjects) {
        this.projects.clear();
        this.projects.addAll(newProjects);
    }
}
