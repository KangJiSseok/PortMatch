package com.portmatch.domain.resume.dto;

import com.portmatch.domain.resume.enums.EmploymentStatus;
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
    private EmploymentStatus employmentStatus;
    private String description;
    private Integer orderIndex;
}
