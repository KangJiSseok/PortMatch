package com.portmatch.domain.companyproject.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record CompanyProjectAnalysisPayload(List<Project> projects) {

    public record Project(
            @JsonProperty("project_name") String projectName,
            String domain,
            String problem,
            String solution,
            List<String> tech
    ) {
    }
}
