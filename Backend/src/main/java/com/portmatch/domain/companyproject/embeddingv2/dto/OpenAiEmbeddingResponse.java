package com.portmatch.domain.companyproject.embeddingv2.dto;

import java.util.List;

public record OpenAiEmbeddingResponse(
        List<OpenAiEmbeddingData> data,
        String model
) {
    public record OpenAiEmbeddingData(
            List<Double> embedding,
            int index,
            String object
    ) {}
}
