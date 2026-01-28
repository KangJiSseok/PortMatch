package com.portmatch.domain.companyproject.embeddingv3.controller;

import com.portmatch.domain.companyproject.embeddingv3.dto.CompanyEmbeddingV3BatchRequest;
import com.portmatch.domain.companyproject.embeddingv3.dto.CompanyEmbeddingV3BatchResponse;
import com.portmatch.domain.companyproject.embeddingv3.dto.CompanyEmbeddingV3UpsertResponse;
import com.portmatch.domain.companyproject.embeddingv3.service.CompanyProjectEmbeddingV3Service;
import com.portmatch.global.api.BaseApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/company-projects")
public class CompanyProjectEmbeddingV3Controller {

    private final CompanyProjectEmbeddingV3Service embeddingService;

    public CompanyProjectEmbeddingV3Controller(CompanyProjectEmbeddingV3Service embeddingService) {
        this.embeddingService = embeddingService;
    }

    /**
     * 분석 결과(로컬 DB)에 저장된 프로젝트들을 기반으로 Gemini 임베딩을 생성하고 저장합니다.
     */
    @PostMapping("/analysis/{analysisId}/embeddings-v3")
    public BaseApiResponse<CompanyEmbeddingV3UpsertResponse> embed(@PathVariable Long analysisId) {
        int saved = embeddingService.embedAndSaveByAnalysisId(analysisId);
        return BaseApiResponse.ok(new CompanyEmbeddingV3UpsertResponse(analysisId, saved));
    }

    /**
     * 여러 분석 ID를 입력 받아 임베딩을 생성하고 저장합니다.
     */
    @PostMapping("/analysis/embeddings-v3")
    public BaseApiResponse<CompanyEmbeddingV3BatchResponse> embedBatch(
            @Valid @RequestBody CompanyEmbeddingV3BatchRequest request
    ) {
        CompanyEmbeddingV3BatchResponse response =
                embeddingService.embedAndSaveByAnalysisIds(request.analysisIds());
        return BaseApiResponse.ok(response);
    }
}
