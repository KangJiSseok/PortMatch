package com.portmatch.domain.resume.entity;

import com.portmatch.domain.resume.enums.EmploymentStatus;
import com.portmatch.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "resume_career_entries",
        indexes = {
                @Index(name = "idx_resume_career_entries_resume_id", columnList = "resume_id"),
                @Index(name = "idx_resume_career_entries_order", columnList = "resume_id, order_index")
        }
)
public class ResumeCareerEntry extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "resume_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_resume_career_entries_resume")
    )
    private Resume resume;

    @Column(nullable = false, length = 200)
    private String company;

    @Column(nullable = false, length = 100)
    private String role;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", length = 20)
    private EmploymentStatus employmentStatus;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    public static ResumeCareerEntry create(
            Resume resume,
            String company,
            String role,
            LocalDate periodStart,
            LocalDate periodEnd,
            EmploymentStatus employmentStatus,
            String description,
            Integer orderIndex
    ) {
        ResumeCareerEntry entry = new ResumeCareerEntry();
        entry.resume = resume;
        entry.company = company;
        entry.role = role;
        entry.periodStart = periodStart;
        entry.periodEnd = periodEnd;
        entry.employmentStatus = employmentStatus;
        entry.description = description;
        entry.orderIndex = orderIndex;
        return entry;
    }

    public void update(
            String company,
            String role,
            LocalDate periodStart,
            LocalDate periodEnd,
            EmploymentStatus employmentStatus,
            String description,
            Integer orderIndex
    ) {
        this.company = company;
        this.role = role;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.employmentStatus = employmentStatus;
        this.description = description;
        if (orderIndex != null) {
            this.orderIndex = orderIndex;
        }
    }
}
