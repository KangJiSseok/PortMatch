package com.portmatch.domain.jobposting.embedding.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portmatch.domain.jobposting.embedding.client.JobPostingEmbeddingClient;
import com.portmatch.domain.jobposting.embedding.dto.JobPostingEmbeddingRequest;
import com.portmatch.domain.jobposting.embedding.dto.JobPostingEmbeddingResponse;
import com.portmatch.domain.jobposting.embedding.repository.JobPostingEmbeddingRepository;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.domain.jobposting.parsed.entity.JobPostingParsed;
import com.portmatch.domain.jobposting.parsed.repository.JobPostingParsedRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class JobPostingEmbeddingService {

    private final JobPostingParsedRepository parsedRepository;
    private final JobPostingEmbeddingRepository embeddingRepository;
    private final JobPostingEmbeddingClient embeddingClient;
    private final ObjectMapper objectMapper;

    public JobPostingEmbeddingService(
            JobPostingParsedRepository parsedRepository,
            JobPostingEmbeddingRepository embeddingRepository,
            JobPostingEmbeddingClient embeddingClient,
            ObjectMapper objectMapper
    ) {
        this.parsedRepository = parsedRepository;
        this.embeddingRepository = embeddingRepository;
        this.embeddingClient = embeddingClient;
        this.objectMapper = objectMapper;
    }

    public void embedAndSave(JobPostingEntity jobPosting) {
        if (jobPosting == null || jobPosting.getId() == null) {
            throw new BusinessException(ResponseCode.INVALID_PARAMETER);
        }

        String detail = jobPosting.getDetail();
        if (detail == null || detail.isBlank()) {
            throw new BusinessException(ResponseCode.INVALID_PARAMETER);
        }

        JobPostingEmbeddingResponse resp = embeddingClient.embed(
                new JobPostingEmbeddingRequest(detail, null, null)
        );

        if (resp == null) {
            throw new BusinessException(ResponseCode.JOB_POSTING_EMBEDDING_EMPTY);
        }
        if (resp.nameEmbedding() == null || resp.domainEmbedding() == null
                || resp.problemEmbedding() == null || resp.solutionEmbedding() == null
                || resp.techEmbedding() == null || resp.architectureEmbedding() == null
                || resp.keywordsEmbedding() == null
                || resp.nameEmbedding().isEmpty()) {
            throw new BusinessException(ResponseCode.JOB_POSTING_EMBEDDING_SIZE_MISMATCH);
        }

        String techJson = toJson(resp.tech());
        String archJson = toJson(resp.architectureExperience());
        String keywordJson = toJson(resp.keywords());

        JobPostingParsed parsed = parsedRepository.findByJobPostingId(jobPosting.getId())
                .orElseGet(() -> new JobPostingParsed(jobPosting.getId()));
        parsed.updateParsed(
                resp.name(),
                resp.domain(),
                resp.problem(),
                resp.solution(),
                techJson,
                archJson,
                keywordJson,
                resp.content(),
                resp.contentHash()
        );
        parsedRepository.save(parsed);

        String nameVector = toVectorString(resp.nameEmbedding());
        String domainVector = toVectorString(resp.domainEmbedding());
        String problemVector = toVectorString(resp.problemEmbedding());
        String solutionVector = toVectorString(resp.solutionEmbedding());
        String techVector = toVectorString(resp.techEmbedding());
        String architectureVector = toVectorString(resp.architectureEmbedding());
        String keywordsVector = toVectorString(resp.keywordsEmbedding());

        embeddingRepository.upsertByJobPostingId(
                jobPosting.getId(),
                resp.name(),
                resp.domain(),
                resp.problem(),
                resp.solution(),
                techJson,
                archJson,
                keywordJson,
                resp.content(),
                resp.contentHash(),
                nameVector,
                domainVector,
                problemVector,
                solutionVector,
                techVector,
                architectureVector,
                keywordsVector,
                resp.problemMissing(),
                resp.solutionMissing(),
                resp.techMissing(),
                resp.architectureMissing()
        );
    }

    private String toJson(List<String> items) {
        try {
            return objectMapper.writeValueAsString(items == null ? List.of() : items);
        } catch (Exception e) {
            throw new BusinessException(ResponseCode.INTERNAL_SERVER_ERROR);
        }
    }

    private String toVectorString(List<Double> vector) {
        List<Double> normalized = normalizeVector(vector);
        return "[" + normalized.stream()
                .map(String::valueOf)
                .collect(java.util.stream.Collectors.joining(",")) + "]";
    }

    private List<Double> normalizeVector(List<Double> vector) {
        if (vector == null || vector.isEmpty()) {
            throw new BusinessException(ResponseCode.EMBEDDING_VECTOR_EMPTY);
        }
        double normSq = 0.0;
        for (Double v : vector) {
            double d = (v == null) ? 0.0 : v;
            normSq += d * d;
        }
        double norm = Math.sqrt(normSq);
        if (norm == 0.0) {
            return vector.stream().map(v -> 0.0).toList();
        }
        final double denom = norm;
        return vector.stream()
                .map(v -> (v == null ? 0.0 : v) / denom)
                .toList();
    }
}
