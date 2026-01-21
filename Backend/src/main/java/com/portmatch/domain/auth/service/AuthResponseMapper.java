package com.portmatch.domain.auth.service;

import com.portmatch.domain.auth.dto.response.LoginResponse;
import com.portmatch.domain.auth.entity.User;
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

    public LoginResponse toLoginResponse(User user) {
        return LoginResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .build();
    }
}
