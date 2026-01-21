package com.portmatch.domain.auth.dto.response;

import com.portmatch.domain.auth.enums.Role;
import lombok.Builder;
import lombok.Getter;

//자동 로그인(세션 남아있는) 경우
@Getter
@Builder
public class MeResponse {
    private Long userId;
    private String email;
    private String name;
    private Role role;
}
