package com.portmatch.domain.companyproject.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

@Getter
public class CompanyProjectAnalysisResult {

    @JsonProperty("company_name")
    private final String companyName;

    private final boolean success;
    private final Object response;
    private final String errorMessage;

    public CompanyProjectAnalysisResult(String companyName, boolean success, Object response, String errorMessage) {
        this.companyName = companyName;
        this.success = success;
        this.response = response;
        this.errorMessage = errorMessage;
    }
}
