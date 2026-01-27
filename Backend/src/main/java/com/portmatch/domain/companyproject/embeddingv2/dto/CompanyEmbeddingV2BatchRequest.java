package com.portmatch.domain.companyproject.embeddingv2.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CompanyEmbeddingV2BatchRequest(
        @NotEmpty(message = "analysisIds 리스트는 필수입니다.")
        List<@NotNull(message = "analysisId는 필수입니다.") Long> analysisIds
) {}
