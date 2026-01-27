package com.portmatch.domain.portfolio.embeddingv2.service;

import com.portmatch.domain.portfolio.embeddingv2.client.PortfolioOpenAiEmbeddingClient;
import com.portmatch.domain.portfolio.embeddingv2.dto.OpenAiEmbeddingResponse;
import com.portmatch.domain.portfolio.embeddingv2.repository.PortfolioProjectEmbeddingV2Repository;
import com.portmatch.domain.portfolio.entity.Portfolio;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysis;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProject;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProjectTech;
import com.portmatch.domain.portfolio.repository.PortfolioAnalysisRepository;
import com.portmatch.domain.portfolio.repository.PortfolioRepository;
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
public class PortfolioEmbeddingV2Service {

    private final PortfolioRepository portfolioRepository;
    private final PortfolioAnalysisRepository analysisRepository;
    private final PortfolioProjectEmbeddingV2Repository embeddingRepository;
    private final PortfolioOpenAiEmbeddingClient openAiEmbeddingClient;

    public PortfolioEmbeddingV2Service(
            PortfolioRepository portfolioRepository,
            PortfolioAnalysisRepository analysisRepository,
            PortfolioProjectEmbeddingV2Repository embeddingRepository,
            PortfolioOpenAiEmbeddingClient openAiEmbeddingClient
    ) {
        this.portfolioRepository = portfolioRepository;
        this.analysisRepository = analysisRepository;
        this.embeddingRepository = embeddingRepository;
        this.openAiEmbeddingClient = openAiEmbeddingClient;
    }

    public int buildForMyPortfolio(Long userId, Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.PORTFOLIO_NOT_FOUND));

        PortfolioAnalysis analysis = analysisRepository.findWithProjectsByPortfolioId(portfolio.getId())
                .orElseThrow(() -> new BusinessException(ResponseCode.ANALYSIS_NOT_FOUND));

        analysis.getProjects().forEach(project -> project.getTechs().size());

        List<PortfolioAnalysisProject> projects = analysis.getProjects();
        if (projects == null || projects.isEmpty()) {
            return 0;
        }

        List<Long> projectIds = new ArrayList<>();
        List<String> contents = new ArrayList<>();

        for (PortfolioAnalysisProject p : projects) {
            projectIds.add(p.getId());

            List<String> techs = (p.getTechs() == null) ? List.of()
                    : p.getTechs().stream()
                    .map(PortfolioAnalysisProjectTech::getTech)
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

            embeddingRepository.upsertByProjectId(
                    portfolioId,
                    analysis.getId(),
                    projectId,
                    content,
                    toVectorString(vector)
            );
        }

        return projectIds.size();
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
                + "[프로젝트주제] " + safe(projectName) + "\n"
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
