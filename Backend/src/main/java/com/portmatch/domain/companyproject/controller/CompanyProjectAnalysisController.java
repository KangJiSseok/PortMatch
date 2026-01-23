package com.portmatch.domain.companyproject.controller;

import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisRequest;
import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisResponse;
import com.portmatch.domain.companyproject.service.CompanyProjectAnalysisService;
import com.portmatch.global.api.BaseApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/company-projects")
public class CompanyProjectAnalysisController {

    private final CompanyProjectAnalysisService companyProjectAnalysisService;

    public CompanyProjectAnalysisController(CompanyProjectAnalysisService companyProjectAnalysisService) {
        this.companyProjectAnalysisService = companyProjectAnalysisService;
    }

    @PostMapping("/analysis")
    public BaseApiResponse<CompanyProjectAnalysisResponse> analyze(@Valid @RequestBody CompanyProjectAnalysisRequest request) {
        return BaseApiResponse.ok(companyProjectAnalysisService.analyze(request));
    }
}
