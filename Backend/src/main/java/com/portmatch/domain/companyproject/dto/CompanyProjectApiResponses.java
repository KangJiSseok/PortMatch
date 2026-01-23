package com.portmatch.domain.companyproject.dto;

import io.swagger.v3.oas.annotations.media.Schema;

public class CompanyProjectApiResponses {

    @Schema(name = "CompanyProjectAnalysisApiResponse")
    public static class CompanyProjectAnalysisApiResponse {
        public int code;
        public String message;
        public CompanyProjectAnalysisResponse data;
    }
}
