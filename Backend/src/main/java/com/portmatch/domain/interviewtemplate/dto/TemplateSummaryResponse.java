package com.portmatch.domain.interviewtemplate.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class TemplateSummaryResponse {
    private Long id;
    private String title;
    private String targetRole;
    private LocalDateTime updatedAt;
}
