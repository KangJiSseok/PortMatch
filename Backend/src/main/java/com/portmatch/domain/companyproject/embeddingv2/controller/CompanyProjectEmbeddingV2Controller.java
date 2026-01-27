package com.portmatch.domain.companyproject.embeddingv2.controller;

import com.portmatch.domain.companyproject.embeddingv2.dto.CompanyEmbeddingV2BatchRequest;
import com.portmatch.domain.companyproject.embeddingv2.dto.CompanyEmbeddingV2BatchResponse;
import com.portmatch.domain.companyproject.embeddingv2.dto.CompanyEmbeddingV2UpsertResponse;
import com.portmatch.domain.companyproject.embeddingv2.service.CompanyProjectEmbeddingV2Service;
import com.portmatch.global.api.BaseApiResponse;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.batch.BatchTaskExecutor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/company-projects")
@Slf4j
public class CompanyProjectEmbeddingV2Controller {

    private final CompanyProjectEmbeddingV2Service embeddingService;

    public CompanyProjectEmbeddingV2Controller(CompanyProjectEmbeddingV2Service embeddingService) {
        this.embeddingService = embeddingService;
    }

    /**
     * 분석 결과(로컬 DB)에 저장된 프로젝트들을 기반으로 OpenAI 임베딩을 생성하고 저장합니다.
     */
    @PostMapping("/analysis/{analysisId}/embeddings-v2")
    public BaseApiResponse<CompanyEmbeddingV2UpsertResponse> embed(@PathVariable Long analysisId) {
        int saved = embeddingService.embedAndSaveByAnalysisId(analysisId);
        return BaseApiResponse.ok(new CompanyEmbeddingV2UpsertResponse(analysisId, saved));
    }

    /**
     * 여러 분석 ID를 입력 받아 임베딩을 생성하고 저장합니다.
     */
    @PostMapping("/analysis/embeddings-v2")
    public BaseApiResponse<CompanyEmbeddingV2BatchResponse> embedBatch(
            @Valid @RequestBody CompanyEmbeddingV2BatchRequest request
    ) {
        log.info("aaaa");
        CompanyEmbeddingV2BatchResponse response =
                embeddingService.embedAndSaveByAnalysisIds(request.analysisIds());
        return BaseApiResponse.ok(response);
    }
}
