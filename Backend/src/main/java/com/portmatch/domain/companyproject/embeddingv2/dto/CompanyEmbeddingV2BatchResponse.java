package com.portmatch.domain.companyproject.embeddingv2.dto;

import java.util.List;

public record CompanyEmbeddingV2BatchResponse(
        List<CompanyEmbeddingV2BatchItemResponse> results
) {}
