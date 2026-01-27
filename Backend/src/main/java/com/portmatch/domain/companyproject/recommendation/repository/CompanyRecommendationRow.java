package com.portmatch.domain.companyproject.recommendation.repository;

public interface CompanyRecommendationRow {
    Long getCompanyId();
    Double getDistance();
    Long getPortfolioProjectId();
    Long getCompanyProjectId();
    String getPortfolioContent();
    String getCompanyContent();
    Double getProjectDistance();
    Double getProblemDistance();
    Double getSolutionDistance();
    Double getTechDistance();
}
