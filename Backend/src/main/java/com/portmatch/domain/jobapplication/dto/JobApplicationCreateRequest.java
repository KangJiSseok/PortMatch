package com.portmatch.domain.jobapplication.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class JobApplicationCreateRequest {

    @NotNull(message = "resumeId is required.")
    private Long resumeId;
}
