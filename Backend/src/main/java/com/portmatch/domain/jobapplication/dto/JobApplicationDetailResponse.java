package com.portmatch.domain.jobapplication.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.portmatch.domain.jobapplication.enums.ApplicationStatus;
import com.portmatch.domain.resume.dto.ResumeResponse;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class JobApplicationDetailResponse {
    private Long applicationId;
    private Long jobPostingId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String userPhone;
    private Long resumeId;
    private ApplicationStatus status;
    private LocalDateTime appliedAt;
    @Schema(description = "Resume view status")
    @JsonProperty("resumeViewed")
    private boolean resumeViewed;
    private ResumeResponse resume;
}
