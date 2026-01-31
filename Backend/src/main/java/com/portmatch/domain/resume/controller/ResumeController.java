package com.portmatch.domain.resume.controller;

import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.domain.resume.dto.ResumeCreateRequest;
import com.portmatch.domain.resume.dto.ResumeResponse;
import com.portmatch.domain.resume.dto.ResumeSummaryResponse;
import com.portmatch.domain.resume.service.ResumeService;
import com.portmatch.global.api.BaseApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
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
        log.info("이력서 생성 요청 - UID: {}", userId);
        return BaseApiResponse.ok(resumeService.createResume(userId, request));
    }

    @GetMapping
    @Operation(summary = "이력서 목록 조회", description = "사용자의 이력서 목록을 조회합니다.")
    public BaseApiResponse<List<ResumeSummaryResponse>> getResumes(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long userId = principal.getUser().getId();
        log.info("이력서 목록 조회 요청 - UID: {}", userId);
        return BaseApiResponse.ok(resumeService.getResumes(userId));
    }

    @GetMapping("/{resumeId}")
    @Operation(summary = "이력서 상세 조회", description = "이력서와 하위 섹션을 조회합니다.")
    public BaseApiResponse<ResumeResponse> getResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId
    ) {
        Long userId = principal.getUser().getId();
        log.info("이력서 상세 조회 요청 - UID: {}, resumeId: {}", userId, resumeId);
        return BaseApiResponse.ok(resumeService.getResume(userId, resumeId));
    }

    @DeleteMapping("/{resumeId}")
    @Operation(summary = "이력서 삭제", description = "이력서를 삭제합니다.")
    public BaseApiResponse<Void> deleteResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId
    ) {
        Long userId = principal.getUser().getId();
        log.info("이력서 삭제 요청 - UID: {}, resumeId: {}", userId, resumeId);
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
        log.info("이력서 전체 교체 요청 - UID: {}, resumeId: {}", userId, resumeId);
        return BaseApiResponse.ok(resumeService.replaceResume(userId, resumeId, request));
    }
}
