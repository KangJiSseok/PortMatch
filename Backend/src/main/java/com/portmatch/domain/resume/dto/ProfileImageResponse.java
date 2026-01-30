package com.portmatch.domain.resume.dto;

import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ProfileImageResponse {

    private final Long id;
    private final Long userId;
    private final String imageUrl;
    private final String imageName;
    private final LocalDateTime createdAt;

    public ProfileImageResponse(
            Long id,
            Long userId,
            String imageUrl,
            String imageName,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.userId = userId;
        this.imageUrl = imageUrl;
        this.imageName = imageName;
        this.createdAt = createdAt;
    }
}
