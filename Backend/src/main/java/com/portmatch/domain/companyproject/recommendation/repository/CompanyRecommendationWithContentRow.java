package com.portmatch.domain.companyproject.recommendation.repository;

public interface CompanyRecommendationWithContentRow {
    Long getCompanyId();
    Long getCompanyProjectId();
    String getCompanyContent();
    Long getPortfolioProjectId();
    String getPortfolioContent();
    Double getDistance();
}
