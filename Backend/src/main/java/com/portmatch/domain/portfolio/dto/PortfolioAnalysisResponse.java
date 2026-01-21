package com.portmatch.domain.portfolio.dto;

import java.util.List;

public record PortfolioAnalysisResponse(List<Project> projects) {

    public record Project(
            String name,
            String problem,
            String solution,
            List<String> tech
    ) {}
}
