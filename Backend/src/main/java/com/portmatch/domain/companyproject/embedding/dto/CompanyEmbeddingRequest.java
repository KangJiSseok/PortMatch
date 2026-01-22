package com.portmatch.domain.companyproject.embedding.dto;

import java.util.List;

public record CompanyEmbeddingRequest(
        List<String> texts,
        String model
) {}
