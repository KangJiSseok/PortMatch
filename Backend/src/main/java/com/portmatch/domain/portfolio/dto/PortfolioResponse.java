package com.portmatch.domain.portfolio.dto;

import com.portmatch.domain.portfolio.entity.Portfolio;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class PortfolioResponse {

    private final Long id;
    private final Long userId;
    private final String originalFilename;
    private final String fileUrl;
    private final String contentType;
    private final Long fileSize;
    private final LocalDateTime createdAt;

    public PortfolioResponse(
            Long id,
            Long userId,
            String originalFilename,
            String fileUrl,
            String contentType,
            Long fileSize,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.userId = userId;
        this.originalFilename = originalFilename;
        this.fileUrl = fileUrl;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.createdAt = createdAt;
    }

    public static PortfolioResponse from(Portfolio portfolio) {
        return new PortfolioResponse(
                portfolio.getId(),
                portfolio.getUser().getId(),
                portfolio.getOriginalFilename(),
                portfolio.getFileUrl(),
                portfolio.getContentType(),
                portfolio.getFileSize(),
                portfolio.getCreatedAt()
        );
    }

}
