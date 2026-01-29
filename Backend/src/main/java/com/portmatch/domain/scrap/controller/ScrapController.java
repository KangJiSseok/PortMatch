package com.portmatch.domain.scrap.controller;

import com.portmatch.domain.scrap.dto.ScrapDto;
import com.portmatch.domain.scrap.service.ScrapService;
import com.portmatch.global.api.BaseApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "스크랩", description = "공고 스크랩 등록 및 조회 API")
@Slf4j
@RestController
@RequestMapping("/api/scraps")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ScrapController {

    private final ScrapService scrapService;

    @Operation(summary = "스크랩 토글", description = "사용자가 공고를 스크랩하거나 취소합니다. 이미 존재하면 삭제, 없으면 등록됩니다.")
    @PostMapping
    public BaseApiResponse<Boolean> toggleScrap(
            @Parameter(description = "사용자 고유 ID", example = "1") @RequestParam("uid") Long uid,
            @Parameter(description = "채용 공고 고유 ID (pid)", example = "job_001") @RequestParam("pid") Long pid) {

        log.info("스크랩 토글 요청 - UID: {}, PID: {}", uid, pid);
        boolean isScraped = scrapService.toggleScrap(uid, pid);
        return BaseApiResponse.ok(isScraped);
    }

    @Operation(summary = "내 스크랩 목록 조회", description = "특정 사용자가 스크랩한 모든 공고의 정보를 최신순으로 가져옵니다.")
    @GetMapping("/{uid}")
    public BaseApiResponse<List<ScrapDto>> getMyScraps(
            @Parameter(description = "사용자 고유 ID", example = "1") @PathVariable("uid") Long uid) {

        log.info("내 스크랩 목록 조회 요청 - UID: {}", uid);
        List<ScrapDto> scraps = scrapService.getMyScraps(uid);
        return BaseApiResponse.ok(scraps);
    }

    @Operation(summary = "스크랩 여부 확인", description = "현재 사용자가 해당 공고를 이미 스크랩했는지 여부(true/false)를 반환합니다.")
    @GetMapping("/check")
    public BaseApiResponse<Boolean> checkScrapStatus(
            @Parameter(description = "사용자 고유 ID", example = "1") @RequestParam("uid") Long uid,
            @Parameter(description = "채용 공고 고유 ID (pid)", example = "job_001") @RequestParam("pid") Long pid) {

        log.info("스크랩 여부 확인 요청 - UID: {}, PID: {}", uid, pid);
        boolean status = scrapService.isScraped(uid, pid);
        return BaseApiResponse.ok(status);
    }
}