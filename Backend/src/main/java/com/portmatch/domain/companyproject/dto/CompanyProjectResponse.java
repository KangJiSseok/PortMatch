package com.portmatch.domain.companyproject.dto;

import java.util.List;

public record CompanyProjectResponse(List<Project> projects) {

    public record Project(
            String name,
            String domain,
            String problem,
            String solution,
            List<String> techs
    ) {
    }
}
