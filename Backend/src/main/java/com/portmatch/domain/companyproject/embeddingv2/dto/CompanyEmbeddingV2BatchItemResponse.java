package com.portmatch.domain.companyproject.embeddingv2.dto;

public record CompanyEmbeddingV2BatchItemResponse(
        Long analysisId,
        Integer saved,
        int code,
        String message
) {}
