package com.portmatch.domain.portfolio.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "portfolio_analysis_project_keywords",
        indexes = {
                @Index(name = "idx_portfolio_analysis_project_keywords_project_id", columnList = "project_id")
        }
)
public class PortfolioAnalysisProjectKeyword {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "project_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_portfolio_analysis_project_keywords_project")
    )
    private PortfolioAnalysisProject project;

    @Column(name = "keyword", nullable = false, length = 255)
    private String keyword;

    public PortfolioAnalysisProjectKeyword(PortfolioAnalysisProject project, String keyword) {
        this.project = project;
        this.keyword = keyword;
    }
}
