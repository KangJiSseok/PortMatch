package com.portmatch.domain.resume.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
@Getter
@Builder
public class SelfIntroductionResponse {
    private Long id;
    private Long resumeId;
    private String title;
    private String answerText;
    private Integer orderIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
