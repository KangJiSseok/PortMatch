package com.portmatch.domain.portfolio.embedding.dto;

import java.util.List;

public record PortfolioEmbeddingResponse(
        String model,
        int dim,
        List<List<Double>> vectors
) {}
