package com.portmatch.domain.resume.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class ResumeCreateRequest {

    @NotBlank(message = "Resume title is required.")
    private String title;

    private Boolean isMain;

    @Valid
    private ProfileUpsertRequest profile;

    @Valid
    private ResumePortfolioUpdateRequest portfolio;

    @Valid
    private List<CareerCreateRequest> careers;

    @Valid
    private List<EducationCreateRequest> educations;

    @Valid
    private List<SelfIntroductionCreateWithQuestionsRequest> selfIntroductions;
}
