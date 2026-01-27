package com.portmatch.domain.companyproject.embeddingv2.controller;

import com.portmatch.domain.companyproject.embeddingv2.dto.CompanyEmbeddingV2UpsertResponse;
import com.portmatch.domain.companyproject.embeddingv2.service.CompanyProjectEmbeddingV2Service;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/company-projects")
public class CompanyProjectEmbeddingV2Controller {

    private final CompanyProjectEmbeddingV2Service embeddingService;

    public CompanyProjectEmbeddingV2Controller(CompanyProjectEmbeddingV2Service embeddingService) {
        this.embeddingService = embeddingService;
    }

    /**
     * 분석 결과(로컬 DB)에 저장된 프로젝트들을 기반으로 OpenAI 임베딩을 생성하고 저장합니다.
     */
    @PostMapping("/analysis/{analysisId}/embeddings-v2")
    public CompanyEmbeddingV2UpsertResponse embed(@PathVariable Long analysisId) {
        int saved = embeddingService.embedAndSaveByAnalysisId(analysisId);
        return new CompanyEmbeddingV2UpsertResponse(analysisId, saved);
    }
}
