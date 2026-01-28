package com.portmatch.domain.interviewtemplate.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class TemplateResponse {
    private Long id;
    private Long userId;
    private String title;
    private String targetRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<TopicResponse> topics;
}
