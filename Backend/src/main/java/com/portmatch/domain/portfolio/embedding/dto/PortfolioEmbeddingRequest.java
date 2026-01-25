package com.portmatch.domain.portfolio.embedding.dto;

import java.util.List;

public record PortfolioEmbeddingRequest(
        List<String> texts
) {}
