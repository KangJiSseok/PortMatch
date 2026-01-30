package com.portmatch.domain.resume.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProfileImageUpdateRequest {

    @NotNull(message = "Profile image id is required.")
    private Long profileImageId;
}
