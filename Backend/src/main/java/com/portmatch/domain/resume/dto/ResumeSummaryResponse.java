package com.portmatch.domain.resume.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ResumeSummaryResponse {
    private Long id;
    private String title;
    private Boolean isMain;
    private LocalDateTime updatedAt;
}
