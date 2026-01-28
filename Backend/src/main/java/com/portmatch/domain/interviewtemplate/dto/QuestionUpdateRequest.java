package com.portmatch.domain.interviewtemplate.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class QuestionUpdateRequest {

    @NotBlank(message = "질문 내용은 필수입니다.")
    private String content;
}
