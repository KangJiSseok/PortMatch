package com.portmatch.domain.resume.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class ResumeResponse {
    private Long id;
    private Long userId;
    private String title;
    private Boolean isMain;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private ProfileResponse profile;
    private ResumePortfolioResponse portfolio;
    private List<CareerResponse> careers;
    private List<EducationResponse> educations;
    private List<SelfIntroductionResponse> selfIntroductions;
}
