package com.portmatch.domain.portfolio.embedding.dto;

import java.util.List;

public record PortfolioEmbeddingResponse(
        List<List<Double>> vectors
) {}
