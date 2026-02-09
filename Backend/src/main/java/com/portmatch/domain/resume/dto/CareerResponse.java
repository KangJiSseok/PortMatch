package com.portmatch.domain.resume.dto;

import com.portmatch.domain.resume.enums.EmploymentStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class CareerResponse {
    private Long id;
    private Long resumeId;
    private String company;
    private String role;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private EmploymentStatus employmentStatus;
    private String description;
    private Integer orderIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
