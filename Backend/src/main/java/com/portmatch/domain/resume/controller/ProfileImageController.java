package com.portmatch.domain.resume.controller;

import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.domain.resume.dto.ProfileImageResponse;
import com.portmatch.domain.resume.service.ProfileImageService;
import com.portmatch.global.api.BaseApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "프로필 이미지", description = "프로필 이미지 업로드 API")
@Slf4j
@RestController
@RequestMapping("/api/profile-images")
@RequiredArgsConstructor
public class ProfileImageController {

    private final ProfileImageService profileImageService;

    @Operation(summary = "프로필 이미지 업로드", description = "프로필 이미지를 S3에 업로드하고 정보를 반환합니다.")
    @PostMapping(path = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseApiResponse<ProfileImageResponse> upload(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestPart("file") MultipartFile file
    ) {
        Long userId = principal.getUser().getId();
        log.info("프로필 이미지 업로드 요청 - UID: {}", userId);
        return BaseApiResponse.ok(profileImageService.upload(userId, file));
    }
}
