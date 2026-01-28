package com.portmatch.domain.interviewtemplate.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TemplateUpdateRequest {

    @NotBlank(message = "템플릿 제목은 필수입니다.")
    private String title;

    @NotBlank(message = "직무는 필수입니다.")
    private String targetRole;
}
