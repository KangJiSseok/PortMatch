package com.portmatch.domain.jobapplication.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.portmatch.domain.jobapplication.enums.ApplicationStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class JobApplicationSummaryResponse {
    private Long applicationId;
    private Long userId;
    private String userName;
    private Long resumeId;
    private String resumeTitle;
    private ApplicationStatus status;
    private LocalDateTime appliedAt;
    @Schema(description = "Resume view status")
    @JsonProperty("resumeViewed")
    private boolean resumeViewed;
}
