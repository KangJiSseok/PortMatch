package com.portmatch.domain.jobapplication.controller;

import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.domain.jobapplication.dto.JobApplicationCreateRequest;
import com.portmatch.domain.jobapplication.dto.JobApplicationResponse;
import com.portmatch.domain.jobapplication.service.JobApplicationService;
import com.portmatch.global.api.BaseApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "공고 지원", description = "공고 지원 생성/취소 API")
@RestController
@RequestMapping("/api/job-posts")
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
        Long userId = principal.getUser().getId();
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
}
