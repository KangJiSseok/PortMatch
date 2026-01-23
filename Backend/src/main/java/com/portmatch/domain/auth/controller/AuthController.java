package com.portmatch.domain.auth.controller;

import com.portmatch.domain.auth.dto.AuthApiResponses;
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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "인증", description = "인증/회원가입 API")
public class AuthController {

    private final AuthSignUpService authSignUpService;
    private final AuthSessionService authSessionService;
    private final AuthResponseMapper authResponseMapper;

    @Operation(summary = "로그인", description = "이메일/비밀번호로 로그인합니다.")
    @ApiResponse(
            responseCode = "200",
            description = "로그인 성공",
            content = @Content(schema = @Schema(implementation = AuthApiResponses.AuthLoginApiResponse.class))
    )
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

    @Operation(summary = "로그아웃", description = "세션을 종료합니다.")
    @ApiResponse(
            responseCode = "200",
            description = "로그아웃 성공",
            content = @Content(schema = @Schema(implementation = AuthApiResponses.AuthVoidApiResponse.class))
    )
    @PostMapping("/logout")
    public BaseApiResponse<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }
        SecurityContextHolder.clearContext();
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "개인 회원가입", description = "개인 회원가입을 진행합니다.")
    @ApiResponse(
            responseCode = "200",
            description = "회원가입 성공",
            content = @Content(schema = @Schema(implementation = AuthApiResponses.AuthVoidApiResponse.class))
    )
    @PostMapping("/signup/applicant")
    public BaseApiResponse<Void> signUpApplicant(@Valid @RequestBody ApplicantSignUpRequest req) {
        authSignUpService.signUpApplicant(req);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "기업 회원가입", description = "기업 회원가입을 진행합니다.")
    @ApiResponse(
            responseCode = "200",
            description = "회원가입 성공",
            content = @Content(schema = @Schema(implementation = AuthApiResponses.AuthVoidApiResponse.class))
    )
    @PostMapping("/signup/company")
    public BaseApiResponse<Void> signUpCompany(@Valid @RequestBody CompanySignUpRequest req) {
        authSignUpService.signUpCompany(req);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "내 정보 조회", description = "로그인한 사용자 정보를 조회합니다.")
    @ApiResponse(
            responseCode = "200",
            description = "조회 성공",
            content = @Content(schema = @Schema(implementation = AuthApiResponses.AuthMeApiResponse.class))
    )
    @GetMapping("/me")
    public BaseApiResponse<LoginResponse> me(@AuthenticationPrincipal UserPrincipal user) {
        if (user == null) {
            return BaseApiResponse.error(ResponseCode.UNAUTHORIZED);
        }
        return BaseApiResponse.ok(authResponseMapper.toLoginResponse(user.getUser()));
    }
}
