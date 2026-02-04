package com.portmatch.domain.jobapplication.entity;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.jobapplication.enums.ApplicationStatus;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.domain.resume.entity.Resume;
import com.portmatch.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(
        name = "job_applications",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_job_applications_user_job_posting",
                columnNames = {"user_id", "job_posting_id"}
        ),
        indexes = {
                @Index(name = "idx_job_applications_user_id", columnList = "user_id"),
                @Index(name = "idx_job_applications_job_posting_id", columnList = "job_posting_id"),
                @Index(name = "idx_job_applications_resume_id", columnList = "resume_id")
        }
)
public class JobApplication extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_job_applications_user")
    )
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "job_posting_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_job_applications_job_posting")
    )
    private JobPostingEntity jobPosting;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "resume_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_job_applications_resume")
    )
    private Resume resume;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private ApplicationStatus status;

    public static JobApplication create(User user, JobPostingEntity jobPosting, Resume resume) {
        JobApplication application = new JobApplication();
        application.user = user;
        application.jobPosting = jobPosting;
        application.resume = resume;
        application.status = ApplicationStatus.APPLIED;
        return application;
    }

    public void updateStatus(ApplicationStatus status) {
        this.status = status;
    }

    @Override
    public String toString() {
        return "JobApplication{" +
                "id=" + id +
                ", user=" + user +
                ", jobPosting=" + jobPosting +
                ", resume=" + resume +
                ", status=" + status +
                '}';
    }
}
