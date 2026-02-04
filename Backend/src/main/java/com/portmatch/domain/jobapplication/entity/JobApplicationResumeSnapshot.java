package com.portmatch.domain.jobapplication.entity;

import com.portmatch.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "job_application_resume_snapshots")
public class JobApplicationResumeSnapshot extends BaseTimeEntity {

    @Id
    @Column(name = "job_application_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(
            name = "job_application_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_job_application_resume_snapshots_application")
    )
    private JobApplication jobApplication;

    @Column(name = "resume_id")
    private Long resumeId;

    @Column(name = "payload_json", nullable = false, columnDefinition = "TEXT")
    private String payloadJson;

    public static JobApplicationResumeSnapshot create(JobApplication jobApplication, Long resumeId, String payloadJson) {
        JobApplicationResumeSnapshot snapshot = new JobApplicationResumeSnapshot();
        snapshot.jobApplication = jobApplication;
        snapshot.resumeId = resumeId;
        snapshot.payloadJson = payloadJson;
        return snapshot;
    }
}
