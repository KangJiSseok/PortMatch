package com.portmatch.domain.companyproject.embedding.controller;

import com.portmatch.domain.companyproject.embedding.dto.CompanyEmbeddingUpsertResponse;
import com.portmatch.domain.companyproject.embedding.service.CompanyProjectEmbeddingService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/company-projects")
public class CompanyProjectEmbeddingController {

    private final CompanyProjectEmbeddingService embeddingService;

    public CompanyProjectEmbeddingController(CompanyProjectEmbeddingService embeddingService) {
        this.embeddingService = embeddingService;
    }

    /**
     * 분석 결과(로컬 DB)에 저장된 프로젝트들을 기반으로 임베딩을 생성하고 저장합니다.
     */
    @PostMapping("/analysis/{analysisId}/embeddings")
    public CompanyEmbeddingUpsertResponse embed(@PathVariable Long analysisId) {
        int saved = embeddingService.embedAndSaveByAnalysisId(analysisId);
        return new CompanyEmbeddingUpsertResponse(analysisId, saved);
    }
}
