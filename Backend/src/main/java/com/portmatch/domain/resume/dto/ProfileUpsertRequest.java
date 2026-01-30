package com.portmatch.domain.resume.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ProfileUpsertRequest {

    @NotBlank(message = "Name is required.")
    private String name;

    private String contact;

    @NotBlank(message = "Email is required.")
    @Email(message = "Email format is invalid.")
    private String email;

    private String address;

    private Long profileImageId;
}
