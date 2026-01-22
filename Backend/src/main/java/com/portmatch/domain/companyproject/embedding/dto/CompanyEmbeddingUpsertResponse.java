package com.portmatch.domain.companyproject.embedding.dto;

public record CompanyEmbeddingUpsertResponse(
        Long analysisId,
        int embeddedProjects
) {}
