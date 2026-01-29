package com.portmatch.domain.companyproject.dto;

import java.util.List;

public record ExplanationMatchPayload(
        String companyName,
        ExplanationMatchHeadline headline,
        List<ExplanationMatchSection> sections
) {}
