package com.portmatch.domain.auth.controller;

import com.portmatch.domain.auth.dto.request.LoginRequest;
import com.portmatch.domain.auth.dto.request.ApplicantSignUpRequest;
import com.portmatch.domain.auth.dto.request.CompanySignUpRequest;
import com.portmatch.domain.auth.dto.response.LoginResponse;
import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.domain.auth.service.AuthResponseMapper;
import com.portmatch.domain.auth.service.AuthSessionService;
import com.portmatch.domain.auth.service.AuthSignUpService;
import com.portmatch.global.api.BaseApiResponse;
import com.portmatch.global.response.ResponseCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthSignUpService authSignUpService;
    private final AuthSessionService authSessionService;
    private final AuthResponseMapper authResponseMapper;
    @PostMapping("/login")
    public BaseApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest req, HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
        UserPrincipal principal = authSessionService.loginByEmail(
                req.getEmail(),
                req.getPassword(),
                req.getExpectedRole(),
                servletRequest,
                servletResponse
        );
        return BaseApiResponse.ok(authResponseMapper.toLoginResponse(principal));
    }

    @PostMapping("/logout")
    public BaseApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        SecurityContextHolder.clearContext();
        return BaseApiResponse.ok(null);
    }

    @PostMapping("/signup/applicant")
    public BaseApiResponse<Void> signUpApplicant(@Valid @RequestBody ApplicantSignUpRequest req) {
        authSignUpService.signUpApplicant(req);
        return BaseApiResponse.ok(null);
    }

    @PostMapping("/signup/company")
    public BaseApiResponse<Void> signUpCompany(@Valid @RequestBody CompanySignUpRequest req) {
        authSignUpService.signUpCompany(req);
        return BaseApiResponse.ok(null);
    }

    @GetMapping("/me")
    public BaseApiResponse<LoginResponse> me(@AuthenticationPrincipal UserPrincipal user) {
        if (user == null) {
            return BaseApiResponse.error(ResponseCode.UNAUTHORIZED);
        }
        return BaseApiResponse.ok(authResponseMapper.toLoginResponse(user.getUser()));
    }
}
