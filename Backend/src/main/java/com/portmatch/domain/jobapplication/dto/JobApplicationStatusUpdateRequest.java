package com.portmatch.domain.jobapplication.dto;

import com.portmatch.domain.jobapplication.enums.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class JobApplicationStatusUpdateRequest {

    @NotNull(message = "status is required.")
    private ApplicationStatus status;
}
