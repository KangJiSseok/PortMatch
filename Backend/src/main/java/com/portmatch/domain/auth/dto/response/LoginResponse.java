package com.portmatch.domain.auth.dto.response;

import com.portmatch.domain.auth.enums.Role;
import lombok.Builder;
import lombok.Getter;

//로그인 직후 response
@Getter
@Builder
public class LoginResponse {
    private Long userId;
    private String email;
    private String name;
    private Role role;
}
