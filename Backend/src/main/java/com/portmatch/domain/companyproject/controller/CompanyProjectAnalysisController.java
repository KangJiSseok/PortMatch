package com.portmatch.domain.companyproject.controller;

import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisRequest;
import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisResponse;
import com.portmatch.domain.companyproject.dto.CompanyProjectApiResponses;
import com.portmatch.domain.companyproject.dto.ExplanationMatchRequestItem;
import com.portmatch.domain.companyproject.dto.ExplanationMatchResponseItem;
import com.portmatch.domain.companyproject.service.CompanyProjectAnalysisService;
import com.portmatch.domain.auth.entity.User;
import com.portmatch.global.api.BaseApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
            content = @Content(schema = @Schema(implementation = CompanyProjectApiResponses.CompanyProjectAnalysisApiResponse.class))
    )
    @PostMapping("/analysis")
    public BaseApiResponse<CompanyProjectAnalysisResponse> analyze(@Valid @RequestBody CompanyProjectAnalysisRequest request) {
        return BaseApiResponse.ok(companyProjectAnalysisService.analyze(request));
    }

    @Operation(
            summary = "회사/포트폴리오 매칭 설명 생성",
            description = "포트폴리오 프로젝트와 회사 프로젝트를 매칭 설명 서비스로 전달합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "설명 생성 성공",
            content = @Content(schema = @Schema(implementation = ExplanationMatchResponseItem.class))
    )
    @PostMapping("/analysis/explanations")
    public BaseApiResponse<ExplanationMatchResponseItem> explainMatches(
            @AuthenticationPrincipal(expression = "user") User user,
            @Valid @RequestBody ExplanationMatchRequestItem request
    ) {
        return BaseApiResponse.ok(companyProjectAnalysisService.explainMatch(user.getId(), request));
    }
}
