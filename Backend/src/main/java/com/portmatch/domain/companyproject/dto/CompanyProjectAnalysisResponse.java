package com.portmatch.domain.companyproject.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class CompanyProjectAnalysisResponse {

    private final List<CompanyProjectAnalysisResult> results;

    public CompanyProjectAnalysisResponse(List<CompanyProjectAnalysisResult> results) {
        this.results = results;
    }
}
