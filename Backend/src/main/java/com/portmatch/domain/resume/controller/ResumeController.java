package com.portmatch.domain.resume.controller;

import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.domain.resume.dto.*;
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

@Tag(name = "이력서", description = "이력서 및 섹션 관리 API")
@Slf4j
@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @Operation(summary = "이력서 생성", description = "사용자가 이력서를 생성합니다.")
    @PostMapping
    public BaseApiResponse<ResumeResponse> createResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ResumeCreateRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("이력서 생성 요청 - UID: {}", userId);
        return BaseApiResponse.ok(resumeService.createResume(userId, request));
    }

    @Operation(summary = "이력서 목록 조회", description = "사용자의 이력서 목록을 조회합니다.")
    @GetMapping
    public BaseApiResponse<List<ResumeSummaryResponse>> getResumes(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long userId = principal.getUser().getId();
        log.info("이력서 목록 조회 요청 - UID: {}", userId);
        return BaseApiResponse.ok(resumeService.getResumes(userId));
    }

    @Operation(summary = "이력서 상세 조회", description = "이력서와 하위 섹션을 조회합니다.")
    @GetMapping("/{resumeId}")
    public BaseApiResponse<ResumeResponse> getResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId
    ) {
        Long userId = principal.getUser().getId();
        log.info("이력서 상세 조회 요청 - UID: {}, resumeId: {}", userId, resumeId);
        return BaseApiResponse.ok(resumeService.getResume(userId, resumeId));
    }

    @Operation(summary = "이력서 수정", description = "이력서 제목을 수정합니다.")
    @PatchMapping("/{resumeId}")
    public BaseApiResponse<ResumeResponse> updateResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @Valid @RequestBody ResumeUpdateRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("이력서 수정 요청 - UID: {}, resumeId: {}", userId, resumeId);
        return BaseApiResponse.ok(resumeService.updateResume(userId, resumeId, request));
    }

    @Operation(summary = "이력서 삭제", description = "이력서를 삭제합니다.")
    @DeleteMapping("/{resumeId}")
    public BaseApiResponse<Void> deleteResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId
    ) {
        Long userId = principal.getUser().getId();
        log.info("이력서 삭제 요청 - UID: {}, resumeId: {}", userId, resumeId);
        resumeService.deleteResume(userId, resumeId);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "대표 이력서 설정", description = "대표 이력서를 설정합니다.")
    @PatchMapping("/{resumeId}/main")
    public BaseApiResponse<Void> setMainResume(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId
    ) {
        Long userId = principal.getUser().getId();
        log.info("대표 이력서 설정 요청 - UID: {}, resumeId: {}", userId, resumeId);
        resumeService.setMainResume(userId, resumeId);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "프로필 수정", description = "프로필 정보를 수정합니다.")
    @PutMapping("/{resumeId}/profile")
    public BaseApiResponse<ProfileResponse> upsertProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @Valid @RequestBody ProfileUpsertRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("프로필 수정 요청 - UID: {}, resumeId: {}", userId, resumeId);
        return BaseApiResponse.ok(resumeService.upsertProfile(userId, resumeId, request));
    }

    @Operation(summary = "프로필 이미지 수정", description = "프로필 이미지 연결을 업데이트합니다.")
    @PatchMapping("/{resumeId}/profile/image")
    public BaseApiResponse<ProfileResponse> updateProfileImage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @Valid @RequestBody ProfileImageUpdateRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("프로필 이미지 수정 요청 - UID: {}, resumeId: {}", userId, resumeId);
        return BaseApiResponse.ok(
                resumeService.updateProfileImage(userId, resumeId, request.getProfileImageId())
        );
    }

    @Operation(summary = "프로필 이미지 삭제", description = "프로필 이미지를 삭제합니다.")
    @DeleteMapping("/{resumeId}/profile/image")
    public BaseApiResponse<Void> deleteProfileImage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId
    ) {
        Long userId = principal.getUser().getId();
        log.info("프로필 이미지 삭제 요청 - UID: {}, resumeId: {}", userId, resumeId);
        resumeService.deleteProfileImage(userId, resumeId);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "경력 추가", description = "경력 항목을 추가합니다.")
    @PostMapping("/{resumeId}/careers")
    public BaseApiResponse<CareerResponse> addCareer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @Valid @RequestBody CareerCreateRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("경력 추가 요청 - UID: {}, resumeId: {}", userId, resumeId);
        return BaseApiResponse.ok(resumeService.addCareer(userId, resumeId, request));
    }

    @Operation(summary = "경력 수정", description = "경력 항목을 수정합니다.")
    @PatchMapping("/{resumeId}/careers/{careerId}")
    public BaseApiResponse<CareerResponse> updateCareer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @PathVariable Long careerId,
            @Valid @RequestBody CareerUpdateRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("경력 수정 요청 - UID: {}, resumeId: {}, careerId: {}", userId, resumeId, careerId);
        return BaseApiResponse.ok(resumeService.updateCareer(userId, resumeId, careerId, request));
    }

    @Operation(summary = "경력 삭제", description = "경력 항목을 삭제합니다.")
    @DeleteMapping("/{resumeId}/careers/{careerId}")
    public BaseApiResponse<Void> deleteCareer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @PathVariable Long careerId
    ) {
        Long userId = principal.getUser().getId();
        log.info("경력 삭제 요청 - UID: {}, resumeId: {}, careerId: {}", userId, resumeId, careerId);
        resumeService.deleteCareer(userId, resumeId, careerId);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "경력 순서 변경", description = "경력 orderIndex를 일괄 변경합니다.")
    @PatchMapping("/{resumeId}/careers/order")
    public BaseApiResponse<Void> reorderCareers(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @Valid @RequestBody CareerReorderRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("경력 순서 변경 요청 - UID: {}, resumeId: {}", userId, resumeId);
        resumeService.reorderCareers(userId, resumeId, request);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "학력 추가", description = "학력 항목을 추가합니다.")
    @PostMapping("/{resumeId}/educations")
    public BaseApiResponse<EducationResponse> addEducation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @Valid @RequestBody EducationCreateRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("학력 추가 요청 - UID: {}, resumeId: {}", userId, resumeId);
        return BaseApiResponse.ok(resumeService.addEducation(userId, resumeId, request));
    }

    @Operation(summary = "학력 수정", description = "학력 항목을 수정합니다.")
    @PatchMapping("/{resumeId}/educations/{educationId}")
    public BaseApiResponse<EducationResponse> updateEducation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @PathVariable Long educationId,
            @Valid @RequestBody EducationUpdateRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("학력 수정 요청 - UID: {}, resumeId: {}, educationId: {}", userId, resumeId, educationId);
        return BaseApiResponse.ok(resumeService.updateEducation(userId, resumeId, educationId, request));
    }

    @Operation(summary = "학력 삭제", description = "학력 항목을 삭제합니다.")
    @DeleteMapping("/{resumeId}/educations/{educationId}")
    public BaseApiResponse<Void> deleteEducation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @PathVariable Long educationId
    ) {
        Long userId = principal.getUser().getId();
        log.info("학력 삭제 요청 - UID: {}, resumeId: {}, educationId: {}", userId, resumeId, educationId);
        resumeService.deleteEducation(userId, resumeId, educationId);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "학력 순서 변경", description = "학력 orderIndex를 일괄 변경합니다.")
    @PatchMapping("/{resumeId}/educations/order")
    public BaseApiResponse<Void> reorderEducations(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @Valid @RequestBody EducationReorderRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("학력 순서 변경 요청 - UID: {}, resumeId: {}", userId, resumeId);
        resumeService.reorderEducations(userId, resumeId, request);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "포트폴리오 업로드/교체", description = "포트폴리오 파일 정보를 저장합니다.")
    @PostMapping("/{resumeId}/portfolio")
    public BaseApiResponse<ResumePortfolioResponse> uploadPortfolio(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @Valid @RequestBody ResumePortfolioUpdateRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("포트폴리오 업로드/교체 요청 - UID: {}, resumeId: {}", userId, resumeId);
        return BaseApiResponse.ok(resumeService.uploadPortfolio(userId, resumeId, request));
    }

    @Operation(summary = "포트폴리오 삭제", description = "포트폴리오 파일 정보를 삭제합니다.")
    @DeleteMapping("/{resumeId}/portfolio")
    public BaseApiResponse<Void> deletePortfolio(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId
    ) {
        Long userId = principal.getUser().getId();
        log.info("포트폴리오 삭제 요청 - UID: {}, resumeId: {}", userId, resumeId);
        resumeService.deletePortfolio(userId, resumeId);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "자기소개서 추가", description = "자기소개서를 추가합니다.")
    @PostMapping("/{resumeId}/self-introductions")
    public BaseApiResponse<SelfIntroductionResponse> addSelfIntroduction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @Valid @RequestBody SelfIntroductionCreateRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("자기소개서 추가 요청 - UID: {}, resumeId: {}", userId, resumeId);
        return BaseApiResponse.ok(resumeService.addSelfIntroduction(userId, resumeId, request));
    }

    @Operation(summary = "자기소개서 수정", description = "자기소개서를 수정합니다.")
    @PatchMapping("/{resumeId}/self-introductions/{selfIntroductionId}")
    public BaseApiResponse<SelfIntroductionResponse> updateSelfIntroduction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @PathVariable Long selfIntroductionId,
            @Valid @RequestBody SelfIntroductionUpdateRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("자기소개서 수정 요청 - UID: {}, resumeId: {}, selfIntroductionId: {}", userId, resumeId, selfIntroductionId);
        return BaseApiResponse.ok(resumeService.updateSelfIntroduction(userId, resumeId, selfIntroductionId, request));
    }

    @Operation(summary = "자기소개서 삭제", description = "자기소개서를 삭제합니다.")
    @DeleteMapping("/{resumeId}/self-introductions/{selfIntroductionId}")
    public BaseApiResponse<Void> deleteSelfIntroduction(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @PathVariable Long selfIntroductionId
    ) {
        Long userId = principal.getUser().getId();
        log.info("자기소개서 삭제 요청 - UID: {}, resumeId: {}, selfIntroductionId: {}", userId, resumeId, selfIntroductionId);
        resumeService.deleteSelfIntroduction(userId, resumeId, selfIntroductionId);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "자기소개서 순서 변경", description = "자기소개서 orderIndex를 일괄 변경합니다.")
    @PatchMapping("/{resumeId}/self-introductions/order")
    public BaseApiResponse<Void> reorderSelfIntroductions(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long resumeId,
            @Valid @RequestBody SelfIntroductionReorderRequest request
    ) {
        Long userId = principal.getUser().getId();
        log.info("자기소개서 순서 변경 요청 - UID: {}, resumeId: {}", userId, resumeId);
        resumeService.reorderSelfIntroductions(userId, resumeId, request);
        return BaseApiResponse.ok(null);
    }
}
