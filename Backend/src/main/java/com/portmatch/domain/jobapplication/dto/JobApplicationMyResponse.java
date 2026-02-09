package com.portmatch.domain.jobapplication.dto;

import com.portmatch.domain.jobapplication.enums.ApplicationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class JobApplicationMyResponse {
    private Long applicationId;
    private Long jobPostingId;
    private String jobPostingTitle;
    private String companyName;
    private String companyCid;
    private ApplicationStatus status;
    private Long resumeId;
    private String resumeTitle;
    private LocalDateTime appliedAt;
}
