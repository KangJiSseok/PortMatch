package com.portmatch.domain.resume.entity;

import com.portmatch.domain.resume.enums.EducationDegree;
import com.portmatch.domain.resume.enums.EducationStatus;
import com.portmatch.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "resume_education_entries",
        indexes = {
                @Index(name = "idx_resume_education_entries_resume_id", columnList = "resume_id"),
                @Index(name = "idx_resume_education_entries_order", columnList = "resume_id, order_index")
        }
)
public class ResumeEducationEntry extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "resume_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_resume_education_entries_resume")
    )
    private Resume resume;

    @Column(nullable = false, length = 200)
    private String school;

    @Column(nullable = false, length = 200)
    private String major;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EducationDegree degree;

    @Column(name = "period_start")
    private LocalDate periodStart;

    @Column(name = "period_end")
    private LocalDate periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private EducationStatus status;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    public static ResumeEducationEntry create(
            Resume resume,
            String school,
            String major,
            EducationDegree degree,
            LocalDate periodStart,
            LocalDate periodEnd,
            EducationStatus status,
            Integer orderIndex
    ) {
        ResumeEducationEntry entry = new ResumeEducationEntry();
        entry.resume = resume;
        entry.school = school;
        entry.major = major;
        entry.degree = degree;
        entry.periodStart = periodStart;
        entry.periodEnd = periodEnd;
        entry.status = status;
        entry.orderIndex = orderIndex;
        return entry;
    }

    public void update(
            String school,
            String major,
            EducationDegree degree,
            LocalDate periodStart,
            LocalDate periodEnd,
            EducationStatus status,
            Integer orderIndex
    ) {
        this.school = school;
        this.major = major;
        this.degree = degree;
        this.periodStart = periodStart;
        this.periodEnd = periodEnd;
        this.status = status;
        if (orderIndex != null) {
            this.orderIndex = orderIndex;
        }
    }
}
