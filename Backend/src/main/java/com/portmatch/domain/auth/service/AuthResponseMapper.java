package com.portmatch.domain.auth.service;

import com.portmatch.domain.auth.dto.response.LoginResponse;
import com.portmatch.domain.auth.dto.response.MeResponse;
import com.portmatch.domain.auth.security.UserPrincipal;
import org.springframework.stereotype.Component;

@Component
public class AuthResponseMapper {

    public LoginResponse toLoginResponse(UserPrincipal principal) {
        return LoginResponse.builder()
                .userId(principal.getUser().getId())
                .email(principal.getUser().getEmail())
                .name(principal.getUser().getName())
                .role(principal.getUser().getRole())
                .build();
    }

    public MeResponse toMeResponse(UserPrincipal principal) {
        return MeResponse.builder()
                .userId(principal.getUser().getId())
                .email(principal.getUser().getEmail())
                .name(principal.getUser().getName())
                .role(principal.getUser().getRole())
                .build();
    }
}
