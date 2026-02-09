package com.portmatch.domain.portfolio.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "portfolio_analysis_projects",
        indexes = {
                @Index(name = "idx_portfolio_analysis_projects_analysis_id", columnList = "analysis_id")
        }
)
public class PortfolioAnalysisProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "analysis_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_portfolio_analysis_projects_analysis")
    )
    private PortfolioAnalysis analysis;

    @Column(name = "name", nullable = false, length = 512)
    private String name;

    @Column(name = "domain", length = 512)
    private String domain;

    @Column(name = "problem", length = 2000)
    private String problem;

    @Column(name = "solution", length = 2000)
    private String solution;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<PortfolioAnalysisProjectTech> techs = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<PortfolioAnalysisProjectArchitectureExperience> architectureExperiences = new ArrayList<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<PortfolioAnalysisProjectKeyword> keywords = new ArrayList<>();

    public PortfolioAnalysisProject(
            PortfolioAnalysis analysis,
            String name,
            String domain,
            String problem,
            String solution
    ) {
        this.analysis = analysis;
        this.name = name;
        this.domain = domain;
        this.problem = problem;
        this.solution = solution;
    }

    public void addTech(String tech) {
        this.techs.add(new PortfolioAnalysisProjectTech(this, tech));
    }

    public void addArchitectureExperience(String architectureExperience) {
        this.architectureExperiences.add(
                new PortfolioAnalysisProjectArchitectureExperience(this, architectureExperience)
        );
    }

    public void addKeyword(String keyword) {
        this.keywords.add(new PortfolioAnalysisProjectKeyword(this, keyword));
    }
}
