package com.portmatch.domain.companyproject.embedding.dto;

import java.util.List;

public record CompanyEmbeddingResponse(
        List<List<Double>> vectors
) {}
