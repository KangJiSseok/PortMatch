package com.portmatch.domain.jobposting.embedding.dto;

import java.util.List;

public record JobPostingMatchResponse(
        List<MatchedJobPosting> matches
) {
    public record MatchedJobPosting(
            Long jobPostingId,
            String title,
            String companyName,
            String problem,
            String solution,
            double similarity,
            double domainSimilarity,
            double techSimilarity,
            double problemSimilarity,
            double architectureSimilarity,
            String portfolioContent,
            String jobPostingContent
    ) {}
}
