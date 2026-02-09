package com.portmatch.domain.jobposting.embedding.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record JobPostingEmbeddingResponse(
        String name,
        String domain,
        String problem,
        String solution,
        List<String> tech,
        @JsonProperty("architecture_experience")
        List<String> architectureExperience,
        List<String> keywords,
        String content,
        @JsonProperty("content_hash")
        String contentHash,
        @JsonProperty("embedding_model")
        String embeddingModel,
        @JsonProperty("embedding_dim")
        int embeddingDim,
        @JsonProperty("name_embedding")
        List<Double> nameEmbedding,
        @JsonProperty("domain_embedding")
        List<Double> domainEmbedding,
        @JsonProperty("problem_embedding")
        List<Double> problemEmbedding,
        @JsonProperty("solution_embedding")
        List<Double> solutionEmbedding,
        @JsonProperty("tech_embedding")
        List<Double> techEmbedding,
        @JsonProperty("architecture_embedding")
        List<Double> architectureEmbedding,
        @JsonProperty("keywords_embedding")
        List<Double> keywordsEmbedding,
        @JsonProperty("problem_missing")
        boolean problemMissing,
        @JsonProperty("solution_missing")
        boolean solutionMissing,
        @JsonProperty("tech_missing")
        boolean techMissing,
        @JsonProperty("architecture_missing")
        boolean architectureMissing
) {}
