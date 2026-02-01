package com.portmatch.domain.scrap.controller;

import com.portmatch.domain.scrap.dto.CompanyScrapDto;
import com.portmatch.domain.scrap.service.CompanyScrapService;
import com.portmatch.global.api.BaseApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "기업 스크랩", description = "기업 스크랩 등록 및 조회 API")
@RestController
@RequestMapping("/api/company-scraps")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CompanyScrapController {

    private final CompanyScrapService companyScrapService;

    @Operation(summary = "기업 스크랩 토글", description = "사용자가 기업을 스크랩하거나 취소합니다. 이미 존재하면 삭제, 없으면 등록됩니다.")
    @PostMapping
    public BaseApiResponse<Boolean> toggleCompanyScrap(
            @Parameter(description = "사용자 고유 ID", example = "1") @RequestParam("uid") Long uid,
            @Parameter(description = "기업 고유 ID (cid)", example = "EDKFJSDKFH") @RequestParam("cid") String cid) {
        boolean isScraped = companyScrapService.toggleCompanyScrap(uid, cid);
        return BaseApiResponse.ok(isScraped);
    }

    @Operation(summary = "내 기업 스크랩 목록 조회", description = "특정 사용자가 스크랩한 모든 기업의 정보를 최신순으로 가져옵니다.")
    @GetMapping("/{uid}")
    public BaseApiResponse<List<CompanyScrapDto>> getMyCompanyScraps(
            @Parameter(description = "사용자 고유 ID", example = "1") @PathVariable("uid") Long uid) {
        List<CompanyScrapDto> scraps = companyScrapService.getMyCompanyScraps(uid);
        return BaseApiResponse.ok(scraps);
    }

    @Operation(summary = "기업 스크랩 여부 확인", description = "현재 사용자가 해당 기업을 이미 스크랩했는지 여부(true/false)를 반환합니다.")
    @GetMapping("/check")
    public BaseApiResponse<Boolean> checkCompanyScrapStatus(
            @Parameter(description = "사용자 고유 ID", example = "1") @RequestParam("uid") Long uid,
            @Parameter(description = "기업 고유 ID (cid)", example = "EDKFJSDKFH") @RequestParam("cid") String cid) {
        boolean status = companyScrapService.isCompanyScraped(uid, cid);
        return BaseApiResponse.ok(status);
    }
}