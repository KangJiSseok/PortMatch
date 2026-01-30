package com.portmatch.domain.resume.dto;

import com.portmatch.domain.resume.enums.EducationDegree;
import com.portmatch.domain.resume.enums.EducationStatus;
import io.swagger.v3.oas.annotations.media.Schema;
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

    @Schema(
            description = "학위",
            type = "string",
            example = "BACHELOR",
            implementation = EducationDegree.class
    )
    private EducationDegree degree;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    @Schema(
            description = "학적 상태",
            type = "string",
            example = "GRADUATED",
            implementation = EducationStatus.class
    )
    private EducationStatus status;
    private Integer orderIndex;
}
