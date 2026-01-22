package com.portmatch.domain.companyproject.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "company_project_analysis_project_techs",
        indexes = {
                @Index(name = "idx_company_project_analysis_project_techs_project_id", columnList = "project_id")
        }
)
public class CompanyProjectAnalysisProjectTech {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "project_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_company_project_analysis_project_techs_project")
    )
    private CompanyProjectAnalysisProject project;

    @Column(name = "tech", nullable = false, length = 255)
    private String tech;

    public CompanyProjectAnalysisProjectTech(CompanyProjectAnalysisProject project, String tech) {
        this.project = project;
        this.tech = tech;
    }
}
