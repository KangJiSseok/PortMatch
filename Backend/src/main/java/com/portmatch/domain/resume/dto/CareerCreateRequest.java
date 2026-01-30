package com.portmatch.domain.resume.dto;

import com.portmatch.domain.resume.enums.EmploymentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class CareerCreateRequest {

    @NotBlank(message = "Company is required.")
    private String company;

    @NotBlank(message = "Role is required.")
    private String role;

    private LocalDate periodStart;
    private LocalDate periodEnd;
    @Schema(
            description = "고용 형태",
            type = "string",
            example = "FULL_TIME",
            implementation = EmploymentStatus.class
    )
    private EmploymentStatus employmentStatus;
    private String description;
    private Integer orderIndex;
}
