package com.portmatch.domain.resume.dto;

import com.portmatch.domain.resume.enums.EducationDegree;
import com.portmatch.domain.resume.enums.EducationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class EducationResponse {
    private Long id;
    private Long resumeId;
    private String school;
    private String major;
    private EducationDegree degree;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private EducationStatus status;
    private Integer orderIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
