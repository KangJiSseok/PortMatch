package com.portmatch.domain.jobposting.embedding.repository;

public interface JobPostingMatchRow {
    Long getJobPostingId();
    Double getSimilarity();
    Double getNameSimilarity();
    Double getDomainSimilarity();
    Double getTechSimilarity();
    Double getProblemSimilarity();
    Double getArchitectureSimilarity();
    String getPortfolioContent();
}
