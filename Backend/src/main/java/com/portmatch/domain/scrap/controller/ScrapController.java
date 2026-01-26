package com.portmatch.domain.scrap.controller;

import com.portmatch.domain.scrap.dto.ScrapDto;
import com.portmatch.domain.scrap.service.ScrapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scraps") // 공통 경로 설정
@RequiredArgsConstructor
public class ScrapController {

    private final ScrapService scrapService;

    /**
     * 스크랩 토글 (등록/해제)
     * POST /api/scraps?uid=1&pid=JP123
     */
    @PostMapping
    public ResponseEntity<String> toggleScrap(@RequestParam Long uid, @RequestParam String pid) {
        boolean isScraped = scrapService.toggleScrap(uid, pid);

        if (isScraped) {
            return ResponseEntity.ok("스크랩 등록 완료!");
        } else {
            return ResponseEntity.ok("스크랩 해제 완료!");
        }
    }

    /**
     * 내 스크랩 목록 조회
     * GET /api/scraps/1
     */
    @GetMapping("/{uid}")
    public ResponseEntity<List<ScrapDto>> getMyScraps(@PathVariable Long uid) {
        List<ScrapDto> scraps = scrapService.getMyScraps(uid);
        return ResponseEntity.ok(scraps);
    }
}