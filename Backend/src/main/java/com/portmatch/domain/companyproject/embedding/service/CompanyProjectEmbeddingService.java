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
import org.springframework.beans.factory.annotation.Value;
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

    private final String embeddingModel;

    public CompanyProjectEmbeddingService(
            CompanyProjectAnalysisRepository analysisRepository,
            CompanyProjectEmbeddingRepository embeddingRepository,
            CompanyEmbeddingClient embeddingClient,
            ObjectMapper objectMapper,
            @Value("${company-embedding.model:text-embedding-3-small}") String embeddingModel
    ) {
        this.analysisRepository = analysisRepository;
        this.embeddingRepository = embeddingRepository;
        this.embeddingClient = embeddingClient;
        this.objectMapper = objectMapper;
        this.embeddingModel = embeddingModel;
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

        // 1) 프로젝트별 텍스트(content) 생성
        List<Long> projectIds = new ArrayList<>();
        List<String> contents = new ArrayList<>();

        for (CompanyProjectAnalysisProject p : projects) {
            projectIds.add(p.getId());

            List<String> techs = (p.getTechs() == null) ? List.of()
                    : p.getTechs().stream()
                    .map(CompanyProjectAnalysisProjectTech::getTech)
                    .filter(t -> t != null && !t.isBlank())
                    .toList();

            contents.add(buildProjectEmbeddingText(
                    companyName,
                    p.getName(),
                    p.getProblem(),
                    p.getSolution(),
                    techs
            ));
        }

        // 2) inference로 배치 임베딩 요청
        CompanyEmbeddingResponse resp = embeddingClient.embed(
                new CompanyEmbeddingRequest(contents, embeddingModel)
        );

        if (resp.vectors() == null || resp.vectors().size() != contents.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Embedding response size mismatch");
        }

        // 3) project_id 기준 upsert 저장
        for (int i = 0; i < projectIds.size(); i++) {
            Long projectId = projectIds.get(i);
            String content = contents.get(i);
            List<Double> vector = resp.vectors().get(i);

            String vectorStr = toVectorString(vector); // "[0.1,0.2,...]"

            embeddingRepository.upsertByProjectId(
                    companyId,
                    analysisId,
                    projectId,
                    content,
                    vectorStr
            );
        }


        return projectIds.size();
    }

    private String buildProjectEmbeddingText(
            String companyName,
            String projectName,
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
                + "[문제] " + safe(problem) + "\n"
                + "[해결] " + safe(solution) + "\n"
                + "[기술] " + techStr;
    }

    private String safe(String s) {
        if (s == null) return "정보 없음";
        String t = s.trim();
        return t.isBlank() ? "정보 없음" : t;
    }


    private String toVectorString(List<Double> vector) {
        return "[" + vector.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(",")) + "]";
    }
}
