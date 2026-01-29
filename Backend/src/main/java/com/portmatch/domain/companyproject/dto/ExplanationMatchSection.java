package com.portmatch.domain.companyproject.dto;

import java.util.List;

public record ExplanationMatchSection(
        String key,
        String title,
        String text,
        List<String> tags
) {}
