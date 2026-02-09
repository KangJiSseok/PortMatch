package com.portmatch.domain.portfolio.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "portfolio_analysis_project_techs",
        indexes = {
                @Index(name = "idx_portfolio_analysis_project_techs_project_id", columnList = "project_id")
        }
)
public class PortfolioAnalysisProjectTech {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "project_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_portfolio_analysis_project_techs_project")
    )
    private PortfolioAnalysisProject project;

    @Column(name = "tech", nullable = false, length = 255)
    private String tech;

    public PortfolioAnalysisProjectTech(PortfolioAnalysisProject project, String tech) {
        this.project = project;
        this.tech = tech;
    }
}
