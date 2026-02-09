package com.portmatch.domain.portfolio.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record PortfolioAnalysisResponse(List<Project> projects) {

    public record Project(
            String name,
            String domain,
            String problem,
            String solution,
            List<String> tech,
            @JsonProperty("architecture_experience")
            List<String> architectureExperience,
            List<String> keywords
    ) {}
}
