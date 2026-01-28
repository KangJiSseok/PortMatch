package com.portmatch.domain.companyproject.embeddingv3.dto;

public record CompanyEmbeddingV3BatchItemResponse(
        Long analysisId,
        Integer embeddedProjects,
        int code,
        String message
) {}
