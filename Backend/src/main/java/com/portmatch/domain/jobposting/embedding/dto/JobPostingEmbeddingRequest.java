package com.portmatch.domain.jobposting.embedding.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record JobPostingEmbeddingRequest(
        String content,
        @JsonProperty("model")
        String model,
        @JsonProperty("embedding_model")
        String embeddingModel
) {}
