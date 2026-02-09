package com.portmatch.domain.companyproject.dto;

import java.util.List;

public record ExplanationServiceProject(
        String projectName,
        String domain,
        String problem,
        String solution,
        List<String> tech
) {}
