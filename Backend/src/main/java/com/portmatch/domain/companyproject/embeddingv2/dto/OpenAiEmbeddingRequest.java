package com.portmatch.domain.companyproject.embeddingv2.dto;

import java.util.List;

public record OpenAiEmbeddingRequest(
        String model,
        List<String> input
) {}
