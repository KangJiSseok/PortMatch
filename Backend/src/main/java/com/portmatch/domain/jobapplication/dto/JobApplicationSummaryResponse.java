package com.portmatch.domain.jobapplication.dto;

import com.portmatch.domain.jobapplication.enums.ApplicationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class JobApplicationSummaryResponse {
    private Long applicationId;
    private Long applicantId;
    private String applicantName;
    private Long resumeId;
    private String resumeTitle;
    private ApplicationStatus status;
    private LocalDateTime appliedAt;
}
