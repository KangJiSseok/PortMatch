package com.portmatch.domain.interviewtemplate.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TopicUpdateRequest {

    @NotBlank(message = "토픽 이름은 필수입니다.")
    private String name;
}
