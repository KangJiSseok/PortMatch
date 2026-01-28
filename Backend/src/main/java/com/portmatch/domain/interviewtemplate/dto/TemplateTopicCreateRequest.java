package com.portmatch.domain.interviewtemplate.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class TemplateTopicCreateRequest {

    @NotBlank(message = "토픽 이름은 필수입니다.")
    private String name;

    @Min(value = 0, message = "orderIndex는 0 이상이어야 합니다.")
    private Integer orderIndex;

    @Valid
    private List<TemplateQuestionCreateRequest> questions;
}
