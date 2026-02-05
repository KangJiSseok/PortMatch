package com.portmatch.domain.jobapplication.controller;

import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.domain.jobapplication.dto.*;
import com.portmatch.domain.jobapplication.service.JobApplicationService;
import com.portmatch.global.api.BaseApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@Tag(name = "공고 지원", description = "공고 지원 생성/취소 API")
@RestController
@RequestMapping("/api/job-postings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class JobApplicationController {

    private final JobApplicationService jobApplicationService;

    @Operation(summary = "공고 지원", description = "지원자가 공고에 지원합니다.")
    @PostMapping("/{id}/apply")
    public BaseApiResponse<JobApplicationResponse> apply(
            @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "공고 ID", example = "1") @PathVariable("id") Long jobPostingId,
            @Valid @RequestBody JobApplicationCreateRequest request
    ) {
        log.info("id");
        Long userId = principal.getUser().getId();
        log.info(userId.toString());
        return BaseApiResponse.ok(jobApplicationService.apply(userId, jobPostingId, request));
    }

    @Operation(summary = "공고 지원 취소", description = "지원자가 공고 지원을 취소합니다.")
    @DeleteMapping("/{id}/apply")
    public BaseApiResponse<Void> cancel(
            @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "공고 ID", example = "1") @PathVariable("id") Long jobPostingId
    ) {
        Long userId = principal.getUser().getId();
        jobApplicationService.cancel(userId, jobPostingId);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "지원자 지원 목록 조회", description = "지원자가 본인이 지원한 공고 목록을 조회합니다.")
    @GetMapping("/applications/me")
    public BaseApiResponse<List<JobApplicationMyResponse>> getMyApplications(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(jobApplicationService.getMyApplications(userId));
    }

    @Operation(summary = "공고별 지원 목록(기업)", description = "기업이 공고별 지원 목록을 조회합니다.")
    @GetMapping("/{id}/applications")
    public BaseApiResponse<List<JobApplicationSummaryResponse>> getApplicationsForCompany(
            @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "공고 ID", example = "1") @PathVariable("id") Long jobPostingId
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(jobApplicationService.getApplicationsForCompany(userId, jobPostingId));
    }


    @Operation(summary = "지원 상세 조회(기업)", description = "기업이 지원 상세(이력서 포함)를 조회합니다.")
    @GetMapping("/{id}/applications/{applicationId}")
    public BaseApiResponse<JobApplicationDetailResponse> getApplicationDetailForCompany(
            @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "공고 ID", example = "1") @PathVariable("id") Long jobPostingId,
            @Parameter(description = "지원 ID", example = "10") @PathVariable("applicationId") Long applicationId
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(
                jobApplicationService.getApplicationDetailForCompany(userId, jobPostingId, applicationId)
        );
    }

    @Operation(summary = "지원 합/불 처리(기업)", description = "기업이 지원 합/불 여부를 변경합니다.")
    @PatchMapping("/{id}/applications/{applicationId}")
    public BaseApiResponse<JobApplicationDetailResponse> updateApplicationStatusForCompany(
            @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "공고 ID", example = "1") @PathVariable("id") Long jobPostingId,
            @Parameter(description = "지원 ID", example = "10") @PathVariable("applicationId") Long applicationId,
            @Valid @RequestBody JobApplicationStatusUpdateRequest request
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(
                jobApplicationService.updateApplicationStatusForCompany(userId, jobPostingId, applicationId, request)
        );
    }

    @Operation(summary = "족축 지원 상태 확인", description = "지원자가 해당 공고에 지원했는지 여부를 확인합니다. status가 true면 지원한 상태")
    @GetMapping("/{id}/application/exists")
    public BaseApiResponse<Boolean> hasApplied(
            @AuthenticationPrincipal UserPrincipal principal,
            @Parameter(description = "공고 ID", example = "1") @PathVariable("id") Long jobPostingId
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(jobApplicationService.hasApplied(userId, jobPostingId));
    }

}