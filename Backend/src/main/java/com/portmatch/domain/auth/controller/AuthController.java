package com.portmatch.domain.auth.controller;

import com.portmatch.domain.auth.dto.request.LoginRequest;
import com.portmatch.domain.auth.dto.response.LoginResponse;
import com.portmatch.domain.auth.dto.response.MeResponse;
import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.domain.auth.service.AuthResponseMapper;
import com.portmatch.domain.auth.service.AuthSessionService;
import com.portmatch.global.api.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthSessionService authSessionService;
    private final AuthResponseMapper authResponseMapper;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest req, HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        UserPrincipal principal = authSessionService.loginByEmail(
                req.getEmail(),
                req.getPassword(),
                req.getExpectedRole(),
                servletRequest,
                servletResponse);
        return ApiResponse.ok(authResponseMapper.toLoginResponse(principal));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        // 1) 세션 무효화
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        // 2) 시큐리티 컨텍스트 제거
        SecurityContextHolder.clearContext();

        // 3) 쿠키 만료 (Postman에서도 쿠키가 사라져 보이게)
        ResponseCookie cookie = ResponseCookie.from("JSESSIONID", "")
                .path("/")
                .maxAge(0)
                .httpOnly(true)
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ApiResponse.ok(null);
    }

    @GetMapping("/me")
    public ApiResponse<MeResponse> me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            // 여기서도 BusinessException으로 통일하면 프론트 대응이 쉬움
            return ApiResponse.error("UNAUTHORIZED", "로그인이 필요합니다.");
        }
        return ApiResponse.ok(authResponseMapper.toMeResponse(principal));
    }
}
