package com.portmatch.domain.portfolio.embedding.dto;

public record PortfolioQueryEmbeddingRequest(
        String query,
        String model
) {}
