package com.portmatch.domain.portfolio.dto;

import lombok.Getter;

@Getter
public class PresignedUrlResponse {

    private final String url;
    private final int expiresInMinutes;

    public PresignedUrlResponse(String url, int expiresInMinutes) {
        this.url = url;
        this.expiresInMinutes = expiresInMinutes;
    }
}
