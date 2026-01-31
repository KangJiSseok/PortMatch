package com.portmatch.domain.portfolio.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "portfolio_analysis_project_architecture_experiences",
        indexes = {
                @Index(
                        name = "idx_portfolio_analysis_project_arch_exp_project_id",
                        columnList = "project_id"
                )
        }
)
public class PortfolioAnalysisProjectArchitectureExperience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "project_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_portfolio_analysis_project_arch_exp_project")
    )
    private PortfolioAnalysisProject project;

    @Column(name = "architecture_experience", nullable = false, length = 255)
    private String architectureExperience;

    public PortfolioAnalysisProjectArchitectureExperience(
            PortfolioAnalysisProject project,
            String architectureExperience
    ) {
        this.project = project;
        this.architectureExperience = architectureExperience;
    }
}
