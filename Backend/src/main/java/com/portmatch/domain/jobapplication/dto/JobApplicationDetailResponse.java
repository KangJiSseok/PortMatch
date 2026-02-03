package com.portmatch.domain.jobapplication.dto;

import com.portmatch.domain.jobapplication.enums.ApplicationStatus;
import com.portmatch.domain.resume.dto.ResumeResponse;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class JobApplicationDetailResponse {
    private Long applicationId;
    private Long jobPostingId;
    private Long applicantId;
    private String applicantName;
    private String applicantEmail;
    private String applicantPhone;
    private Long resumeId;
    private ApplicationStatus status;
    private LocalDateTime appliedAt;
    private ResumeResponse resume;
}
