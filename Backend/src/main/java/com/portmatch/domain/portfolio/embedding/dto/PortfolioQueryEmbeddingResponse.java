package com.portmatch.domain.portfolio.embedding.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record PortfolioQueryEmbeddingResponse(
        String query,
        List<String> tech,
        List<String> keywords,
        @JsonProperty("architecture_experience")
        List<String> architectureExperience,
        @JsonProperty("expanded_concepts")
        List<String> expandedConcepts,
        @JsonProperty("embedding_model")
        String embeddingModel,
        @JsonProperty("embedding_dim")
        int embeddingDim,
        @JsonProperty("tech_embedding")
        List<Double> techEmbedding,
        @JsonProperty("keyword_embedding")
        List<Double> keywordEmbedding,
        @JsonProperty("architecture_embedding")
        List<Double> architectureEmbedding,
        @JsonProperty("unified_embedding")
        List<Double> unifiedEmbedding,
        @JsonProperty("tech_missing")
        boolean techMissing,
        @JsonProperty("keyword_missing")
        boolean keywordMissing,
        @JsonProperty("architecture_missing")
        boolean architectureMissing
) {}

