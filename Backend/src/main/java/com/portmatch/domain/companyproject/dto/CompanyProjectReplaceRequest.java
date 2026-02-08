package com.portmatch.domain.companyproject.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CompanyProjectReplaceRequest(List<Project> projects) {

    public record Project(
            @NotBlank String name,
            String domain,
            String problem,
            String solution,
            List<String> techs
    ) {
    }
}
