package com.portmatch.domain.companyproject.entity;

import com.portmatch.domain.companies.entity.Company;
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
        name = "company_project_analyses",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_company_project_analyses_company_id", columnNames = "company_id")
        }
)
public class CompanyProjectAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "company_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_company_project_analyses_company")
    )
    private Company company;

    @OneToMany(mappedBy = "analysis", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<CompanyProjectAnalysisProject> projects = new ArrayList<>();

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

    public CompanyProjectAnalysis(Company company) {
        this.company = company;
    }

    public void replaceProjects(List<CompanyProjectAnalysisProject> newProjects) {
        this.projects.clear();
        this.projects.addAll(newProjects);
    }
}
