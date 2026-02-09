package com.portmatch.domain.resume.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ResumePortfolioResponse {
    private Long portfolioId;
    private Long resumeId;
    private String fileUrl;
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private LocalDateTime createdAt;
}
