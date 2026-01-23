package com.portmatch.domain.portfolio.controller;

import com.portmatch.domain.portfolio.dto.PortfolioAnalysisResponse;
import com.portmatch.domain.portfolio.dto.PortfolioResponse;
import com.portmatch.domain.portfolio.dto.PresignedUrlResponse;
import com.portmatch.domain.portfolio.service.PortfolioAnalysisService;
import com.portmatch.domain.portfolio.service.PortfolioService;
import com.portmatch.domain.auth.entity.User;
import com.portmatch.global.api.BaseApiResponse;
import com.portmatch.global.response.ResponseCode;
import lombok.extern.slf4j.Slf4j;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;


import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/portfolios")
@Tag(name = "포트폴리오", description = "포트폴리오 업로드 및 분석 API")
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final PortfolioAnalysisService portfolioAnalysisService;

    public PortfolioController(
            PortfolioService portfolioService,
            PortfolioAnalysisService portfolioAnalysisService
    ) {
        this.portfolioService = portfolioService;
        this.portfolioAnalysisService = portfolioAnalysisService;
    }

    @Operation(
            summary = "내 포트폴리오 파일 업로드",
            description = "로그인한 사용자의 포트폴리오 파일을 업로드하고 생성된 포트폴리오 정보를 반환합니다."
    )


    @ApiResponse(
            responseCode = "200",
            description = "업로드 성공",
            content = @Content(schema = @Schema(implementation = PortfolioResponse.class))
    )
    @PostMapping(path = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PortfolioResponse upload(
            @Parameter(hidden = true)
            @AuthenticationPrincipal(expression = "user") User user,
            @Parameter(description = "포트폴리오 파일", required = true)
            @RequestPart("file") MultipartFile file
    ) {
        return portfolioService.upload(user.getId(), file);
    }

    @Operation(
            summary = "내 포트폴리오 목록 조회",
            description = "로그인한 사용자가 업로드한 모든 포트폴리오를 반환합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "목록 조회 성공",
            content = @Content(array = @ArraySchema(schema = @Schema(implementation = PortfolioResponse.class)))
    )
    @GetMapping("/me")
    public List<PortfolioResponse> getByUser(
            @Parameter(hidden = true)
            @AuthenticationPrincipal(expression = "user") User user
    ) {
        return portfolioService.getByUserId(user.getId());
    }

    @Operation(
            summary = "프리사인드 URL 조회",
            description = "포트폴리오 파일 접근을 위한 프리사인드 URL을 반환합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "프리사인드 URL 조회 성공",
            content = @Content(schema = @Schema(implementation = PresignedUrlResponse.class))
    )
    @GetMapping("/{portfolioId}/presigned-url")
    public PresignedUrlResponse getPresignedUrl(
            @Parameter(description = "포트폴리오 ID", required = true)
            @PathVariable Long portfolioId
    ) {
        return portfolioService.getPresignedUrl(portfolioId, 10);
    }

    @Operation(
            summary = "내 포트폴리오 분석 요청",
            description = "로그인한 사용자의 포트폴리오 분석을 요청하고 분석 결과를 반환합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "분석 요청 성공",
            content = @Content(schema = @Schema(implementation = Object.class))
    )
    @PostMapping("/me/{portfolioId}/analysis")
    public Object analyzePortfolio(
            @Parameter(hidden = true)
            @AuthenticationPrincipal(expression = "user") User user,
            @Parameter(description = "포트폴리오 ID", required = true)
            @PathVariable Long portfolioId
    ) {
        return portfolioAnalysisService.analyze(user.getId(), portfolioId);
    }

    @Operation(
            summary = "내 포트폴리오 분석 결과 조회",
            description = "로그인한 사용자의 포트폴리오 분석 결과를 반환합니다."
    )


    @ApiResponse(
            responseCode = "200",
            description = "분석 결과 조회 성공",
            content = @Content(schema = @Schema(implementation = BaseApiResponse.class))
    )
    @GetMapping("/me/{portfolioId}/analysis")
    public ResponseEntity<BaseApiResponse<PortfolioAnalysisResponse>> getAnalysis(
            @Parameter(hidden = true)
            @AuthenticationPrincipal(expression = "user") User user,
            @Parameter(description = "포트폴리오 ID", required = true)
            @PathVariable Long portfolioId
    ) {
        try {
            PortfolioAnalysisResponse response = portfolioAnalysisService.getAnalysis(user.getId(), portfolioId);
            return ResponseEntity.ok(BaseApiResponse.ok(response));
        } catch (ResponseStatusException exception) {
            if (exception.getStatusCode() == HttpStatus.NOT_FOUND
                    && "Portfolio analysis not found".equals(exception.getReason())) {
                return ResponseEntity.ok(BaseApiResponse.error(ResponseCode.ANALYSIS_NOT_FOUND));
            }
            throw exception;
        }
    }
}