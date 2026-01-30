package com.portmatch.domain.resume.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ResumeUpdateRequest {

    @NotBlank(message = "Resume title is required.")
    private String title;
}
