package com.portmatch.domain.companyproject.dto;

import jakarta.validation.constraints.NotNull;

public record ExplanationMatchRequestItem(
        @NotNull(message = "companyId는 필수입니다.")
        Long companyId,
        @NotNull(message = "portfolioProjectId는 필수입니다.")
        Long portfolioProjectId,
        @NotNull(message = "companyProjectId는 필수입니다.")
        Long companyProjectId
) {}
