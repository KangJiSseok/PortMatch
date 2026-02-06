package com.portmatch.domain.interviewschedule.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.interviewschedule.enums.InterviewStatus;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interview_schedule")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class InterviewScheduleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "users_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id")
    private JobPostingEntity jobPosting;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Seoul")
    private LocalDateTime time;

    @Enumerated(EnumType.STRING)
    private InterviewStatus status;

    public void updateSchedule(LocalDateTime time, InterviewStatus status) {
        if (time != null) this.time = time;
        if (status != null) this.status = status;
    }
}
