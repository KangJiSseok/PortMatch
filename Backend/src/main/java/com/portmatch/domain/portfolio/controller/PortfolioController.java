package com.portmatch.domain.portfolio.controller;

import com.portmatch.domain.portfolio.dto.PortfolioAnalysisResponse;
import com.portmatch.domain.portfolio.dto.PortfolioApiResponses;
import com.portmatch.domain.portfolio.dto.PortfolioResponse;
import com.portmatch.domain.portfolio.dto.PresignedUrlResponse;
import com.portmatch.domain.portfolio.service.PortfolioAnalysisService;
import com.portmatch.domain.portfolio.embedding.service.PortfolioEmbeddingService;
import com.portmatch.domain.portfolio.service.PortfolioService;
import com.portmatch.domain.auth.entity.User;
import com.portmatch.global.api.BaseApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.util.List;

@RestController
@RequestMapping("/api/portfolios")
@Tag(name = "포트폴리오", description = "포트폴리오 업로드 및 분석 API")
public class PortfolioController {

    private final PortfolioService portfolioService;
    private final PortfolioAnalysisService portfolioAnalysisService;
    private final PortfolioEmbeddingService portfolioEmbeddingService;

    public PortfolioController(
            PortfolioService portfolioService,
            PortfolioAnalysisService portfolioAnalysisService,
            PortfolioEmbeddingService portfolioEmbeddingService
    ) {
        this.portfolioService = portfolioService;
        this.portfolioAnalysisService = portfolioAnalysisService;
        this.portfolioEmbeddingService = portfolioEmbeddingService;
    }

    @Operation(
            summary = "내 포트폴리오 파일 업로드",
            description = "로그인한 사용자의 포트폴리오 파일을 업로드하고 생성된 포트폴리오 정보를 반환합니다."
    )


    @ApiResponse(
            responseCode = "200",
            description = "업로드 성공",
            content = @Content(schema = @Schema(implementation = PortfolioApiResponses.PortfolioUploadApiResponse.class))
    )
    @PostMapping(path = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BaseApiResponse<PortfolioResponse> upload(
            @Parameter(hidden = true)
            @AuthenticationPrincipal(expression = "user") User user,
            @Parameter(description = "포트폴리오 파일", required = true)
            @RequestPart("file") MultipartFile file
    ) {
        return BaseApiResponse.ok(portfolioService.upload(user.getId(), file));
    }

    @Operation(
            summary = "내 포트폴리오 목록 조회",
            description = "로그인한 사용자가 업로드한 모든 포트폴리오를 반환합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "목록 조회 성공",
            content = @Content(schema = @Schema(implementation = PortfolioApiResponses.PortfolioListApiResponse.class))
    )
    @GetMapping("/me")
    public BaseApiResponse<List<PortfolioResponse>> getByUser(
            @Parameter(hidden = true)
            @AuthenticationPrincipal(expression = "user") User user
    ) {
        return BaseApiResponse.ok(portfolioService.getByUserId(user.getId()));
    }

    @Operation(
            summary = "프리사인드 URL 조회",
            description = "포트폴리오 파일 접근을 위한 프리사인드 URL을 반환합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "프리사인드 URL 조회 성공",
            content = @Content(schema = @Schema(implementation = PortfolioApiResponses.PresignedUrlApiResponse.class))
    )
    @GetMapping("/{portfolioId}/presigned-url")
    public BaseApiResponse<PresignedUrlResponse> getPresignedUrl(
            @Parameter(description = "포트폴리오 ID", required = true)
            @PathVariable Long portfolioId
    ) {
        return BaseApiResponse.ok(portfolioService.getPresignedUrl(portfolioId, 10));
    }

    @Operation(
            summary = "내 포트폴리오 분석 요청",
            description = "로그인한 사용자의 포트폴리오 분석을 요청하고 분석 결과를 반환합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "분석 요청 성공",
            content = @Content(schema = @Schema(implementation = PortfolioApiResponses.PortfolioAnalysisApiResponse.class))
    )
    @PostMapping("/me/{portfolioId}/analysis")
    public BaseApiResponse<Object> analyzePortfolio(
            @Parameter(hidden = true)
            @AuthenticationPrincipal(expression = "user") User user,
            @Parameter(description = "포트폴리오 ID", required = true)
            @PathVariable Long portfolioId
    ) {
        Object result = portfolioAnalysisService.analyze(user.getId(), portfolioId);
        portfolioEmbeddingService.buildForMyPortfolio(user.getId(), portfolioId);
        return BaseApiResponse.ok(result);
    }

    @Operation(
            summary = "내 포트폴리오 첨삭(V2) 요청",
            description = "로그인한 사용자의 포트폴리오에 대해 첨삭(Feedback)이 포함된 심층 분석(V2)을 요청하고 결과를 반환합니다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "첨삭 요청 성공",
            content = @Content(schema = @Schema(implementation = Object.class))
    )
    @PostMapping("/me/{portfolioId}/analysis-v2")
    public BaseApiResponse<Object> analyzePortfolioV2(
            @Parameter(hidden = true)
            @AuthenticationPrincipal(expression = "user") User user,
            @Parameter(description = "포트폴리오 ID", required = true)
            @PathVariable Long portfolioId
    ) {
        Object result = portfolioAnalysisService.analyzeV2(user.getId(), portfolioId);
        // V2는 현재 단순 반환만 수행하므로 임베딩 로직은 제외
        // 추후 필요하다면 여기에 portfolioEmbeddingService.buildForMyPortfolio(...) 추가 가능
        return BaseApiResponse.ok(result);
    }

    @Operation(
            summary = "내 포트폴리오 분석 결과 조회",
            description = "로그인한 사용자의 포트폴리오 분석 결과를 반환합니다."
    )


    @ApiResponse(
            responseCode = "200",
            description = "분석 결과 조회 성공",
            content = @Content(schema = @Schema(implementation = PortfolioApiResponses.PortfolioAnalysisResultApiResponse.class))
    )
    @GetMapping("/me/{portfolioId}/analysis")
    public BaseApiResponse<PortfolioAnalysisResponse> getAnalysis(
            @Parameter(hidden = true)
            @AuthenticationPrincipal(expression = "user") User user,
            @Parameter(description = "포트폴리오 ID", required = true)
            @PathVariable Long portfolioId
    ) {
        return BaseApiResponse.ok(portfolioAnalysisService.getAnalysis(user.getId(), portfolioId));
    }

    @Operation(
            summary = "내 포트폴리오 삭제",
            description = "로그인한 사용자의 포트폴리오를 삭제합니다. (S3 + DB)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "삭제 성공",
            content = @Content(schema = @Schema(implementation = PortfolioApiResponses.PortfolioDeleteApiResponse.class))
    )
    @DeleteMapping("/me/{portfolioId}")
    public BaseApiResponse<Void> deletePortfolio(
            @Parameter(hidden = true)
            @AuthenticationPrincipal(expression = "user") User user,
            @Parameter(description = "포트폴리오 ID", required = true)
            @PathVariable Long portfolioId
    ) {
        portfolioService.deleteForUser(user.getId(), portfolioId);
        return BaseApiResponse.ok(null);
    }
}
