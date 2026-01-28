package com.portmatch.domain.portfolio.embeddingv3.dto;

import java.util.List;

public record GeminiEmbeddingResponse(
        String model,
        int dim,
        List<List<Double>> vectors
) {}
