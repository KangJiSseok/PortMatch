package com.portmatch.domain.resume.controller;

import com.portmatch.domain.auth.enums.Role;
import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.domain.resume.dto.ResumeCreateRequest;
import com.portmatch.domain.resume.dto.ResumeResponse;
import com.portmatch.domain.resume.dto.ResumeSummaryResponse;
import com.portmatch.domain.resume.service.ResumeService;
import com.portmatch.global.api.BaseApiResponse;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.portmatch.global.response.ResponseCode.RESUME_NOT_FOUND;

@RestController
@RequestMapping("/api/resumes")
@Tag(name = "이력서", description = "이력서 관리 API")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping
    @Operation(summary = "이력서 생성", description = "사용자가 이력서를 생성합니다.")
    public BaseApiResponse<ResumeResponse> createResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ResumeCreateRequest request
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(resumeService.createResume(userId, request));
    }

    @GetMapping
    @Operation(summary = "이력서 목록 조회", description = "사용자의 이력서 목록을 조회합니다.")
    public BaseApiResponse<List<ResumeSummaryResponse>> getResumes(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(resumeService.getResumes(userId));
    }

    @GetMapping("/{resumeId}")
    @Operation(summary = "이력서 상세 조회", description = "이력서와 하위 섹션을 조회합니다.")
    public BaseApiResponse<ResumeResponse> getResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(resumeService.getResume(userId, resumeId));
    }

    @GetMapping("/main/{userId}")
    @Operation(summary = "메인 이력서 상세 조회", description = "기업유저만 지원자의 메인 이력서를 상세 조회합니다.")
    public BaseApiResponse<ResumeResponse> getMainResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId
    ) {
        if (principal.getUser().getRole() != Role.COMPANY) {
            throw new BusinessException(ResponseCode.ROLE_MISMATCH);
        }
        return resumeService.getMainResume(userId)
                .map(BaseApiResponse::ok)
                .orElseGet(() -> BaseApiResponse.error(RESUME_NOT_FOUND));
    }

    @DeleteMapping("/{resumeId}")
    @Operation(summary = "이력서 삭제", description = "이력서를 삭제합니다.")
    public BaseApiResponse<Void> deleteResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId
    ) {
        Long userId = principal.getUser().getId();
        resumeService.deleteResume(userId, resumeId);
        return BaseApiResponse.ok(null);
    }

    @PutMapping("/{resumeId}")
    @Operation(summary = "이력서 전체 교체", description = "이력서 항목을 전체 삭제 후 요청 값으로 교체합니다.")
    public BaseApiResponse<ResumeResponse> replaceResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @Valid @RequestBody ResumeCreateRequest request
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(resumeService.replaceResume(userId, resumeId, request));
    }

    @PutMapping("/{resumeId}/main")
    @Operation(summary = "메인 이력서 교체", description = "해당 이력서를 메인으로 설정하고 나머지는 메인이력서에서 제외합니다.")
    public BaseApiResponse<ResumeResponse> setMainResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(resumeService.setMainResume(userId, resumeId));
    }
}
