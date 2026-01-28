package com.portmatch.domain.portfolio.embeddingv3.service;

import com.portmatch.domain.portfolio.embeddingv3.client.PortfolioGeminiEmbeddingClient;
import com.portmatch.domain.portfolio.embeddingv3.dto.GeminiEmbeddingResponse;
import com.portmatch.domain.portfolio.embeddingv3.repository.PortfolioProjectEmbeddingV3Repository;
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
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PortfolioEmbeddingV3Service {

    private static final int FIELDS_PER_PROJECT = 4;

    private final PortfolioRepository portfolioRepository;
    private final PortfolioAnalysisRepository analysisRepository;
    private final PortfolioProjectEmbeddingV3Repository embeddingRepository;
    private final PortfolioGeminiEmbeddingClient embeddingClient;

    public PortfolioEmbeddingV3Service(
            PortfolioRepository portfolioRepository,
            PortfolioAnalysisRepository analysisRepository,
            PortfolioProjectEmbeddingV3Repository embeddingRepository,
            PortfolioGeminiEmbeddingClient embeddingClient
    ) {
        this.portfolioRepository = portfolioRepository;
        this.analysisRepository = analysisRepository;
        this.embeddingRepository = embeddingRepository;
        this.embeddingClient = embeddingClient;
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

        List<ProjectEmbeddingPayload> payloads = new ArrayList<>();
        List<String> texts = new ArrayList<>();

        for (PortfolioAnalysisProject p : projects) {
            List<String> techs = (p.getTechs() == null) ? List.of()
                    : p.getTechs().stream()
                    .map(PortfolioAnalysisProjectTech::getTech)
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
                    portfolioId,
                    analysis.getId(),
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
