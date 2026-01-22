package com.portmatch.domain.portfolio.embedding.dto;

import java.util.List;

public record PortfolioEmbeddingUpsertResult(
        Long portfolioId,
        Long analysisId,
        String model,
        int total,
        int insertedCount,
        int updatedCount,
        int skippedCount,
        List<Detail> details
) {
    public enum Action { INSERTED, UPDATED, SKIPPED }

    public record Detail(
            Long projectId,
            Action action,
            String reason
    ) {}
}
