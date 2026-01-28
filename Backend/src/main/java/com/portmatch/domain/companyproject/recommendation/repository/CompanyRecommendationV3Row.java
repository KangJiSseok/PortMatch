package com.portmatch.domain.companyproject.recommendation.repository;

public interface CompanyRecommendationV3Row {
    Long getCompanyId();
    Long getCompanyProjectId();
    String getCompanyContent();
    Long getPortfolioProjectId();
    String getPortfolioContent();
    Double getNameSimilarity();
    Double getProblemSimilarity();
    Double getSolutionSimilarity();
    Double getTechSimilarity();
    Double getSimilarity();
}
