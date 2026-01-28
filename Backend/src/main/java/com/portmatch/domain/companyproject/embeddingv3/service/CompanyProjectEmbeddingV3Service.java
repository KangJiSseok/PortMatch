package com.portmatch.domain.companyproject.embeddingv3.service;

import com.portmatch.domain.companyproject.embeddingv3.client.GeminiEmbeddingClient;
import com.portmatch.domain.companyproject.embeddingv3.dto.CompanyEmbeddingV3BatchItemResponse;
import com.portmatch.domain.companyproject.embeddingv3.dto.CompanyEmbeddingV3BatchResponse;
import com.portmatch.domain.companyproject.embeddingv3.dto.GeminiEmbeddingResponse;
import com.portmatch.domain.companyproject.embeddingv3.repository.CompanyProjectEmbeddingV3Repository;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysis;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysisProject;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysisProjectTech;
import com.portmatch.domain.companyproject.repository.CompanyProjectAnalysisRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CompanyProjectEmbeddingV3Service {

    private static final int FIELDS_PER_PROJECT = 4;

    private final CompanyProjectAnalysisRepository analysisRepository;
    private final CompanyProjectEmbeddingV3Repository embeddingRepository;
    private final GeminiEmbeddingClient embeddingClient;

    public CompanyProjectEmbeddingV3Service(
            CompanyProjectAnalysisRepository analysisRepository,
            CompanyProjectEmbeddingV3Repository embeddingRepository,
            GeminiEmbeddingClient embeddingClient
    ) {
        this.analysisRepository = analysisRepository;
        this.embeddingRepository = embeddingRepository;
        this.embeddingClient = embeddingClient;
    }

    public int embedAndSaveByAnalysisId(Long analysisId) {
        CompanyProjectAnalysis analysis = analysisRepository.findByIdWithProjects(analysisId)
                .orElseThrow(() -> new BusinessException(ResponseCode.ANALYSIS_NOT_FOUND));

        analysis.getProjects().forEach(p -> p.getTechs().size());

        Long companyId = analysis.getCompany().getId();
        List<CompanyProjectAnalysisProject> projects = analysis.getProjects();
        if (projects == null || projects.isEmpty()) {
            return 0;
        }

        List<ProjectEmbeddingPayload> payloads = new ArrayList<>();
        List<String> texts = new ArrayList<>();

        for (CompanyProjectAnalysisProject p : projects) {
            List<String> techs = (p.getTechs() == null) ? List.of()
                    : p.getTechs().stream()
                    .map(CompanyProjectAnalysisProjectTech::getTech)
                    .filter(t -> t != null && !t.isBlank())
                    .toList();

            String projectName = safe(p.getName());
            String problem = safe(p.getProblem());
            String solution = safe(p.getSolution());
            String techStr = buildTechString(techs);
            String content = buildProjectEmbeddingText(projectName, problem, solution, techStr);

            payloads.add(new ProjectEmbeddingPayload(
                    p.getId(),
                    projectName,
                    problem,
                    solution,
                    techStr,
                    content
            ));

            texts.add(projectName);
            texts.add(problem);
            texts.add(solution);
            texts.add(techStr);
        }

        GeminiEmbeddingResponse resp = embeddingClient.embed(texts);
        if (resp.vectors() == null || resp.vectors().size() != texts.size()) {
            throw new BusinessException(ResponseCode.OPENAI_EMBEDDING_SIZE_MISMATCH);
        }

        for (int i = 0; i < payloads.size(); i++) {
            ProjectEmbeddingPayload payload = payloads.get(i);
            int base = i * FIELDS_PER_PROJECT;

            String nameVector = toVectorString(resp.vectors().get(base));
            String problemVector = toVectorString(resp.vectors().get(base + 1));
            String solutionVector = toVectorString(resp.vectors().get(base + 2));
            String techVector = toVectorString(resp.vectors().get(base + 3));

            embeddingRepository.upsertByProjectId(
                    companyId,
                    analysisId,
                    payload.projectId(),
                    payload.projectName(),
                    payload.problem(),
                    payload.solution(),
                    payload.techs(),
                    payload.content(),
                    nameVector,
                    problemVector,
                    solutionVector,
                    techVector
            );
        }

        return payloads.size();
    }

    public CompanyEmbeddingV3BatchResponse embedAndSaveByAnalysisIds(
            List<Long> analysisIds
    ) {
        if (analysisIds == null || analysisIds.isEmpty()) {
            throw new BusinessException(ResponseCode.INVALID_PARAMETER, "analysisIds", "analysisIds 리스트는 필수입니다.");
        }
        List<CompanyEmbeddingV3BatchItemResponse> results = new ArrayList<>();
        for (Long analysisId : analysisIds) {
            if (analysisId == null) {
                results.add(new CompanyEmbeddingV3BatchItemResponse(
                        null,
                        null,
                        ResponseCode.INVALID_PARAMETER.getCode(),
                        "analysisId는 필수입니다."
                ));
                continue;
            }
            try {
                int saved = embedAndSaveByAnalysisId(analysisId);
                results.add(new CompanyEmbeddingV3BatchItemResponse(
                        analysisId,
                        saved,
                        ResponseCode.OK.getCode(),
                        ResponseCode.OK.getMessage()
                ));
            } catch (BusinessException ex) {
                ResponseCode code = ex.getResponseCode();
                results.add(new CompanyEmbeddingV3BatchItemResponse(
                        analysisId,
                        null,
                        code.getCode(),
                        code.getMessage()
                ));
            } catch (Exception ex) {
                ResponseCode code = ResponseCode.INTERNAL_SERVER_ERROR;
                results.add(new CompanyEmbeddingV3BatchItemResponse(
                        analysisId,
                        null,
                        code.getCode(),
                        code.getMessage()
                ));
            }
        }
        return new CompanyEmbeddingV3BatchResponse(results);
    }

    private String buildProjectEmbeddingText(
            String projectName,
            String problem,
            String solution,
            String techStr
    ) {
        return ""
                + "[프로젝트명] " + projectName + "\n"
                + "[문제] " + problem + "\n"
                + "[해결] " + solution + "\n"
                + "[기술] " + techStr;
    }

    private String buildTechString(List<String> techs) {
        return (techs == null || techs.isEmpty())
                ? "정보 없음"
                : techs.stream().map(String::trim).filter(s -> !s.isBlank()).collect(Collectors.joining(", "));
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

    private record ProjectEmbeddingPayload(
            Long projectId,
            String projectName,
            String problem,
            String solution,
            String techs,
            String content
    ) {}
}
