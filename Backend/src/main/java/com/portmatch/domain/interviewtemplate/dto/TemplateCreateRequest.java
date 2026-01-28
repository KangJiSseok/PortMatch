package com.portmatch.domain.interviewtemplate.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

import jakarta.validation.Valid;

import java.util.List;

@Getter
@NoArgsConstructor
public class TemplateCreateRequest {

    @NotBlank(message = "템플릿 제목은 필수입니다.")
    private String title;

    @NotBlank(message = "직무는 필수입니다.")
    private String targetRole;

    @Valid
    private List<TemplateTopicCreateRequest> topics;
}
