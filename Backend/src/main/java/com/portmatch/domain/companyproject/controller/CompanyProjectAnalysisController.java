package com.portmatch.domain.companyproject.controller;

import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisRequest;
import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisResponse;
import com.portmatch.domain.companyproject.service.CompanyProjectAnalysisService;
import com.portmatch.global.api.BaseApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "회사 프로젝트", description = "회사 프로젝트 분석 API")
@RestController
@RequestMapping("/api/company-projects")
public class CompanyProjectAnalysisController {

    private final CompanyProjectAnalysisService companyProjectAnalysisService;

    public CompanyProjectAnalysisController(CompanyProjectAnalysisService companyProjectAnalysisService) {
        this.companyProjectAnalysisService = companyProjectAnalysisService;
    }

    @Operation(
            summary = "회사 프로젝트 분석 요청",
            description = "회사명을 기반으로 회사 프로젝트 분석을 수행하고 결과를 반환합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "분석 성공",
            content = @Content(schema = @Schema(implementation = BaseApiResponse.class))
    )
    @PostMapping("/analysis")
    public BaseApiResponse<CompanyProjectAnalysisResponse> analyze(@Valid @RequestBody CompanyProjectAnalysisRequest request) {
        return BaseApiResponse.ok(companyProjectAnalysisService.analyze(request));
    }
}
