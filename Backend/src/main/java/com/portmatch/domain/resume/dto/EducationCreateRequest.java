package com.portmatch.domain.resume.dto;

import com.portmatch.domain.resume.enums.EducationDegree;
import com.portmatch.domain.resume.enums.EducationStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class EducationCreateRequest {

    @NotBlank(message = "School is required.")
    private String school;

    @NotBlank(message = "Major is required.")
    private String major;

    private EducationDegree degree;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private EducationStatus status;
    private Integer orderIndex;
}
