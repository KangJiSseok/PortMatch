package com.portmatch.domain.companyproject.dto;

public record ExplanationServiceRequest(
        String companyName,
        ExplanationServiceProject portfolio,
        ExplanationServiceProject company
) {}
