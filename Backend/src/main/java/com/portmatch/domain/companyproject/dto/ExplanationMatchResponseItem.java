package com.portmatch.domain.companyproject.dto;

public record ExplanationMatchResponseItem(
        Long companyId,
        Long portfolioProjectId,
        Long companyProjectId,
        boolean success,
        ExplanationMatchPayload payload,
        String error
) {}
