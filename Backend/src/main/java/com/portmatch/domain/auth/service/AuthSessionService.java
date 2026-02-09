package com.portmatch.domain.auth.service;

import com.portmatch.domain.auth.enums.Role;
import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthSessionService {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    public UserPrincipal loginByEmail(
            String email,
            String rawPassword,
            Role expectedRole,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        try {
            Authentication authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(email, rawPassword)
                    );

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

            // role mismatch 방어
            if (expectedRole != null && principal.getUser().getRole() != expectedRole) {
                SecurityContextHolder.clearContext();
                throw new BusinessException(
                        ResponseCode.ROLE_MISMATCH,
                        "expectedRole",
                        "선택한 로그인 유형과 계정 유형이 일치하지 않습니다."
                );
            }

            // ✅ 세션에 명시적으로 저장 (정석)
            securityContextRepository.saveContext(context, request, response);

            return principal;

        } catch (BadCredentialsException e) {
            throw new BusinessException(
                    ResponseCode.INVALID_CREDENTIALS,
                    "email",
                    "이메일 또는 비밀번호가 올바르지 않습니다."
            );
        }
    }

}