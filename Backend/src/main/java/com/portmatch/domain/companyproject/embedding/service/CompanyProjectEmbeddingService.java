package com.portmatch.domain.companyproject.embedding.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portmatch.domain.companyproject.embedding.client.CompanyEmbeddingClient;
import com.portmatch.domain.companyproject.embedding.dto.CompanyEmbeddingRequest;
import com.portmatch.domain.companyproject.embedding.dto.CompanyEmbeddingResponse;
import com.portmatch.domain.companyproject.embedding.repository.CompanyProjectEmbeddingRepository;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysis;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysisProject;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysisProjectTech;
import com.portmatch.domain.companyproject.repository.CompanyProjectAnalysisRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CompanyProjectEmbeddingService {

    private final CompanyProjectAnalysisRepository analysisRepository;
    private final CompanyProjectEmbeddingRepository embeddingRepository;
    private final CompanyEmbeddingClient embeddingClient;
    private final ObjectMapper objectMapper;

    public CompanyProjectEmbeddingService(
            CompanyProjectAnalysisRepository analysisRepository,
            CompanyProjectEmbeddingRepository embeddingRepository,
            CompanyEmbeddingClient embeddingClient,
            ObjectMapper objectMapper
    ) {
        this.analysisRepository = analysisRepository;
        this.embeddingRepository = embeddingRepository;
        this.embeddingClient = embeddingClient;
        this.objectMapper = objectMapper;
    }

    public int embedAndSaveByAnalysisId(Long analysisId) {
        CompanyProjectAnalysis analysis = analysisRepository.findByIdWithProjects(analysisId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "analysis not found: " + analysisId));

        analysis.getProjects().forEach(p -> p.getTechs().size());

        Long companyId = analysis.getCompany().getId();
        String companyName = analysis.getCompany().getCompaniesName();

        List<CompanyProjectAnalysisProject> projects = analysis.getProjects();
        if (projects == null || projects.isEmpty()) {
            return 0;
        }

        // 1) ?꾨줈?앺듃蹂??띿뒪??content) ?앹꽦
        List<Long> projectIds = new ArrayList<>();
        List<String> contents = new ArrayList<>();
        List<String> textsToEmbed = new ArrayList<>();
        List<FieldEmbeddingIndices> embeddingIndices = new ArrayList<>();
        List<FieldMissingFlags> missingFlags = new ArrayList<>();

        for (CompanyProjectAnalysisProject p : projects) {
            projectIds.add(p.getId());

            List<String> techs = (p.getTechs() == null) ? List.of()
                    : p.getTechs().stream()
                    .map(CompanyProjectAnalysisProjectTech::getTech)
                    .filter(t -> t != null && !t.isBlank())
                    .toList();

            String techStr = techs.isEmpty()
                    ? "N/A"
                    : techs.stream().map(String::trim).filter(s -> !s.isBlank()).collect(Collectors.joining(", "));

            String content = buildProjectEmbeddingText(
                    companyName,
                    p.getName(),
                    p.getDomain(),
                    p.getProblem(),
                    p.getSolution(),
                    techs
            );

            contents.add(content);

            int projectIdx = textsToEmbed.size();
            textsToEmbed.add(buildFieldEmbeddingText("project", p.getName()));

            int domainIdx = textsToEmbed.size();
            textsToEmbed.add(buildFieldEmbeddingText("domain", p.getDomain()));

            int problemIdx = textsToEmbed.size();
            textsToEmbed.add(buildFieldEmbeddingText("problem", p.getProblem()));

            int solutionIdx = textsToEmbed.size();
            textsToEmbed.add(buildFieldEmbeddingText("solution", p.getSolution()));

            int techIdx = textsToEmbed.size();
            textsToEmbed.add(buildFieldEmbeddingText("tech", techStr));

            embeddingIndices.add(new FieldEmbeddingIndices(
                    projectIdx,
                    domainIdx,
                    problemIdx,
                    solutionIdx,
                    techIdx
            ));

            missingFlags.add(new FieldMissingFlags(
                    isMissing(p.getProblem()),
                    isMissing(p.getSolution()),
                    techs.isEmpty()
            ));
        }

        // 2) inference濡?諛곗튂 ?꾨쿋???붿껌
        CompanyEmbeddingResponse resp = embeddingClient.embed(
                new CompanyEmbeddingRequest(textsToEmbed)
        );

        if (resp.vectors() == null || resp.vectors().size() != textsToEmbed.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Embedding response size mismatch");
        }

        // 3) project_id 湲곗? upsert ???
        for (int i = 0; i < projectIds.size(); i++) {
            Long projectId = projectIds.get(i);
            String content = contents.get(i);
            FieldEmbeddingIndices indices = embeddingIndices.get(i);
            FieldMissingFlags flags = missingFlags.get(i);

            String projectVector = toVectorString(resp.vectors().get(indices.projectIdx()));
            String domainVector = toVectorString(resp.vectors().get(indices.domainIdx()));
            String problemVector = toVectorString(resp.vectors().get(indices.problemIdx()));
            String solutionVector = toVectorString(resp.vectors().get(indices.solutionIdx()));
            String techVector = toVectorString(resp.vectors().get(indices.techIdx()));

            embeddingRepository.upsertByProjectId(
                    companyId,
                    analysisId,
                    projectId,
                    content,
                    projectVector,
                    domainVector,
                    problemVector,
                    solutionVector,
                    techVector,
                    flags.problemMissing(),
                    flags.solutionMissing(),
                    flags.techMissing()
            );
        }


        return projectIds.size();
    }

    private record FieldEmbeddingIndices(
            int projectIdx,
            int domainIdx,
            int problemIdx,
            int solutionIdx,
            int techIdx
    ) {
    }

    private record FieldMissingFlags(
            boolean problemMissing,
            boolean solutionMissing,
            boolean techMissing
    ) {
    }

    private String buildProjectEmbeddingText(
            String companyName,
            String projectName,
            String domain,
            String problem,
            String solution,
            List<String> techs
    ) {
        String techStr = (techs == null || techs.isEmpty())
                ? "정보 없음"
                : techs.stream().map(String::trim).filter(s -> !s.isBlank()).collect(Collectors.joining(", "));

                return ""
                + "[회사] " + safe(companyName) + "\n"
                + "[프로젝트명] " + safe(projectName) + "\n"
                + "[도메인] " + safe(domain) + "\n"
                + "[문제] " + safe(problem) + "\n"
                + "[해결] " + safe(solution) + "\n"
                + "[기술] " + techStr;
    }

    private String buildFieldEmbeddingText(String label, String value) {
        return "[" + label + "] " + safe(value);
    }

    private String safe(String s) {
        if (s == null) return "정보 없음";
        String t = s.trim();
        return t.isBlank() ? "정보 없음" : t;
    }

    private boolean isMissing(String s) {
        return s == null || s.trim().isBlank();
    }



    private String toVectorString(List<Double> vector) {
        List<Double> normalized = normalizeVector(vector);
        return "[" + normalized.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",")) + "]";
    }

    private List<Double> normalizeVector(List<Double> vector) {
        if (vector == null || vector.isEmpty()) {
            throw new IllegalArgumentException("Vector must not be null or empty");
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

