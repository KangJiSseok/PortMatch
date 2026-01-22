package com.portmatch.domain.companyproject.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "company_project_analysis_projects",
        indexes = {
                @Index(name = "idx_company_project_analysis_projects_analysis_id", columnList = "analysis_id")
        }
)
public class CompanyProjectAnalysisProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "analysis_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_company_project_analysis_projects_analysis")
    )
    private CompanyProjectAnalysis analysis;

    @Column(name = "name", nullable = false, length = 512)
    private String name;

    @Column(name = "problem", length = 2000)
    private String problem;

    @Column(name = "solution", length = 2000)
    private String solution;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<CompanyProjectAnalysisProjectTech> techs = new ArrayList<>();

    public CompanyProjectAnalysisProject(
            CompanyProjectAnalysis analysis,
            String name,
            String problem,
            String solution
    ) {
        this.analysis = analysis;
        this.name = name;
        this.problem = problem;
        this.solution = solution;
    }

    public void addTech(String tech) {
        this.techs.add(new CompanyProjectAnalysisProjectTech(this, tech));
    }
}
