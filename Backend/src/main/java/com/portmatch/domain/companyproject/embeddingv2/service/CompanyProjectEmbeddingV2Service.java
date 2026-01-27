package com.portmatch.domain.companyproject.embeddingv2.service;

import com.portmatch.domain.companyproject.embeddingv2.client.OpenAiEmbeddingClient;
import com.portmatch.domain.companyproject.embeddingv2.dto.CompanyEmbeddingV2BatchItemResponse;
import com.portmatch.domain.companyproject.embeddingv2.dto.CompanyEmbeddingV2BatchResponse;
import com.portmatch.domain.companyproject.embeddingv2.dto.OpenAiEmbeddingResponse;
import com.portmatch.domain.companyproject.embeddingv2.repository.CompanyProjectEmbeddingV2Repository;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysis;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysisProject;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysisProjectTech;
import com.portmatch.domain.companyproject.repository.CompanyProjectAnalysisRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class CompanyProjectEmbeddingV2Service {

    private final CompanyProjectAnalysisRepository analysisRepository;
    private final CompanyProjectEmbeddingV2Repository embeddingRepository;
    private final OpenAiEmbeddingClient openAiEmbeddingClient;

    public CompanyProjectEmbeddingV2Service(
            CompanyProjectAnalysisRepository analysisRepository,
            CompanyProjectEmbeddingV2Repository embeddingRepository,
            OpenAiEmbeddingClient openAiEmbeddingClient
    ) {
        this.analysisRepository = analysisRepository;
        this.embeddingRepository = embeddingRepository;
        this.openAiEmbeddingClient = openAiEmbeddingClient;
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
                    p.getName(),
                    p.getProblem(),
                    p.getSolution(),
                    techs
            ));
        }

        OpenAiEmbeddingResponse resp = openAiEmbeddingClient.embed(contents);
        if (resp.data() == null || resp.data().size() != contents.size()) {
            throw new BusinessException(ResponseCode.OPENAI_EMBEDDING_SIZE_MISMATCH);
        }

        List<OpenAiEmbeddingResponse.OpenAiEmbeddingData> data = new ArrayList<>(resp.data());
        data.sort(Comparator.comparingInt(OpenAiEmbeddingResponse.OpenAiEmbeddingData::index));

        for (int i = 0; i < projectIds.size(); i++) {
            OpenAiEmbeddingResponse.OpenAiEmbeddingData item = data.get(i);
            if (item.index() != i || item.embedding() == null) {
                throw new BusinessException(ResponseCode.OPENAI_EMBEDDING_INDEX_MISMATCH);
            }
        }

        for (int i = 0; i < projectIds.size(); i++) {
            Long projectId = projectIds.get(i);
            String content = contents.get(i);
            List<Double> vector = data.get(i).embedding();

            String vectorStr = toVectorString(vector);

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

    public CompanyEmbeddingV2BatchResponse embedAndSaveByAnalysisIds(
            List<Long> analysisIds
    ) {
        if (analysisIds == null || analysisIds.isEmpty()) {
            throw new BusinessException(ResponseCode.INVALID_PARAMETER, "analysisIds", "analysisIds 리스트는 필수입니다.");
        }
        List<CompanyEmbeddingV2BatchItemResponse> results = new ArrayList<>();
        for (Long analysisId : analysisIds) {
            if (analysisId == null) {
                results.add(new CompanyEmbeddingV2BatchItemResponse(
                        null,
                        null,
                        ResponseCode.INVALID_PARAMETER.getCode(),
                        "analysisId는 필수입니다."
                ));
                continue;
            }
            try {
                int saved = embedAndSaveByAnalysisId(analysisId);
                results.add(new CompanyEmbeddingV2BatchItemResponse(
                        analysisId,
                        saved,
                        ResponseCode.OK.getCode(),
                        ResponseCode.OK.getMessage()
                ));
            } catch (BusinessException ex) {
                ResponseCode code = ex.getResponseCode();
                results.add(new CompanyEmbeddingV2BatchItemResponse(
                        analysisId,
                        null,
                        code.getCode(),
                        code.getMessage()
                ));
            } catch (Exception ex) {
                ResponseCode code = ResponseCode.INTERNAL_SERVER_ERROR;
                results.add(new CompanyEmbeddingV2BatchItemResponse(
                        analysisId,
                        null,
                        code.getCode(),
                        code.getMessage()
                ));
            }
        }
        return new CompanyEmbeddingV2BatchResponse(results);
    }

    private String buildProjectEmbeddingText(
            String projectName,
            String problem,
            String solution,
            List<String> techs
    ) {
        String techStr = (techs == null || techs.isEmpty())
                ? "정보 없음"
                : techs.stream().map(String::trim).filter(s -> !s.isBlank()).collect(Collectors.joining(", "));

        return ""
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
