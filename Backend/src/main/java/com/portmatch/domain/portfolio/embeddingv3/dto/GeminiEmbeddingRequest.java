package com.portmatch.domain.portfolio.embeddingv3.dto;

import java.util.List;

public record GeminiEmbeddingRequest(
        List<String> texts,
        String model
) {}
