package com.portmatch.domain.resume.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SelfIntroductionCreateRequest {

    @NotBlank(message = "Title is required.")
    private String title;

    @NotBlank(message = "Answer text is required.")
    private String answerText;

    private Integer orderIndex;
}
