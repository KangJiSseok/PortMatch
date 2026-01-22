package com.portmatch.domain.auth.controller;

import com.portmatch.domain.auth.dto.request.LoginRequest;
import com.portmatch.domain.auth.dto.response.LoginResponse;
import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.domain.auth.service.AuthResponseMapper;
import com.portmatch.domain.auth.service.AuthSessionService;
import com.portmatch.global.api.BaseApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthSessionService authSessionService;
    private final AuthResponseMapper authResponseMapper;

    @PostMapping("/login")
    public BaseApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest req, HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        UserPrincipal principal = authSessionService.loginByEmail(
                req.getEmail(),
                req.getPassword(),
                req.getExpectedRole(),
                servletRequest,
                servletResponse);
        return BaseApiResponse.ok(authResponseMapper.toLoginResponse(principal));
    }

    @PostMapping("/logout")
    public BaseApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
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

        return BaseApiResponse.ok(null);
    }

    @GetMapping("/me")
    public BaseApiResponse<LoginResponse> me(
            @AuthenticationPrincipal(expression = "user") User user
    ) {
        if (user == null) {
            return BaseApiResponse.error("UNAUTHORIZED", "로그인이 필요합니다.");
        }
        return BaseApiResponse.ok(authResponseMapper.toLoginResponse(user));
    }


}
