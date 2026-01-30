package com.portmatch.domain.resume.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ProfileResponse {
    private Long id;
    private Long resumeId;
    private String name;
    private String contact;
    private String email;
    private String address;
    private Long profileImageId;
    private String profileImageUrl;
    private String profileImageName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
