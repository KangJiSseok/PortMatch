package com.portmatch.domain.portfolio.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

public class PortfolioApiResponses {

    @Schema(name = "PortfolioUploadApiResponse")
    public static class PortfolioUploadApiResponse {
        public int code;
        public String message;
        public PortfolioResponse data;
    }

    @Schema(name = "PortfolioListApiResponse")
    public static class PortfolioListApiResponse {
        public int code;
        public String message;
        public List<PortfolioResponse> data;
    }

    @Schema(name = "PresignedUrlApiResponse")
    public static class PresignedUrlApiResponse {
        public int code;
        public String message;
        public PresignedUrlResponse data;
    }

    @Schema(name = "PortfolioAnalysisApiResponse")
    public static class PortfolioAnalysisApiResponse {
        public int code;
        public String message;
        public Object data;
    }

    @Schema(name = "PortfolioAnalysisResultApiResponse")
    public static class PortfolioAnalysisResultApiResponse {
        public int code;
        public String message;
        public PortfolioAnalysisResponse data;
    }

    @Schema(name = "PortfolioDeleteApiResponse")
    public static class PortfolioDeleteApiResponse {
        public int code;
        public String message;
        public Object data;
    }
}
