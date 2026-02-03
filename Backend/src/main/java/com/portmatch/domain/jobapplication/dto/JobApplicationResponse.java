package com.portmatch.domain.jobapplication.dto;

import com.portmatch.domain.jobapplication.enums.ApplicationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class JobApplicationResponse {
    private Long id;
    private Long applicantId;
    private Long jobPostingId;
    private Long resumeId;
    private ApplicationStatus status;
    private LocalDateTime createdAt;
}
