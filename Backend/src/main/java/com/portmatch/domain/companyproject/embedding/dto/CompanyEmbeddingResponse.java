package com.portmatch.domain.companyproject.embedding.dto;

import java.util.List;

public record CompanyEmbeddingResponse(
        String model,
        int dim,
        List<List<Double>> vectors
) {}
