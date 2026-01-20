package com.portmatch.domain.portfolio.controller;

import com.portmatch.domain.portfolio.dto.PortfolioResponse;
import com.portmatch.domain.portfolio.dto.PresignedUrlResponse;
import com.portmatch.domain.portfolio.service.PortfolioAnalysisService;
import com.portmatch.domain.portfolio.service.PortfolioService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/portfolios")
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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PortfolioResponse upload(
            @RequestParam("userId") Long userId,
            @RequestPart("file") MultipartFile file
    ) {
        return portfolioService.upload(userId, file);
    }

    @GetMapping
    public List<PortfolioResponse> getByUser(@RequestParam("userId") Long userId) {
        return portfolioService.getByUserId(userId);
    }

    @GetMapping("/{portfolioId}/presigned-url")
    public PresignedUrlResponse getPresignedUrl(@PathVariable Long portfolioId) {
        return portfolioService.getPresignedUrl(portfolioId, 10);
    }

    @PostMapping("/{portfolioId}/analysis")
    public Object analyzePortfolio(@PathVariable Long portfolioId) {
        return portfolioAnalysisService.analyze(portfolioId);
    }
}
