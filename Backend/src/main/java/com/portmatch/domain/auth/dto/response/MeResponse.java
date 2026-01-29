package com.portmatch.domain.auth.dto.response;

import com.portmatch.domain.auth.enums.Role;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MeResponse {
    private Long userId;
    private String email;
    private String name;
    private Role role;
    private String cid;

}
