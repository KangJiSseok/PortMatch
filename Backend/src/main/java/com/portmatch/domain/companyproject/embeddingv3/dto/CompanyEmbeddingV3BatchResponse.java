package com.portmatch.domain.companyproject.embeddingv3.dto;

import java.util.List;

public record CompanyEmbeddingV3BatchResponse(
        List<CompanyEmbeddingV3BatchItemResponse> results
) {}
