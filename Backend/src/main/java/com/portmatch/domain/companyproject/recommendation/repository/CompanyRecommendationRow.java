package com.portmatch.domain.companyproject.recommendation.repository;

public interface CompanyRecommendationRow {
    Long getCompanyId();
    String getCompanyName();
    Double getDistance();
    Long getPortfolioProjectId();
    Long getCompanyProjectId();
    String getPortfolioContent();
    String getCompanyContent();
    Double getProjectSimilarity();
    Double getDomainSimilarity();
    Double getProblemSimilarity();
    Double getSolutionSimilarity();
    Double getTechSimilarity();
}
