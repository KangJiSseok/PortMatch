package com.portmatch.domain.companyproject.dto;

import java.util.List;

public record ExplanationMatchResponse(
        List<ExplanationMatchResponseItem> results
) {}
