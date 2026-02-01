package com.portmatch.domain.portfolio.embedding.service;

import com.portmatch.domain.portfolio.embedding.client.PortfolioAnalysisClient;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingRequest;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingResponse;
import com.portmatch.domain.portfolio.embedding.entity.PortfolioProjectEmbedding;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioProjectEmbeddingRepository;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioUserArchitectureEmbeddingRepository;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioUserKeywordEmbeddingRepository;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioUserTechEmbeddingRepository;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioUserUnifiedEmbeddingRepository;
import com.portmatch.domain.portfolio.entity.Portfolio;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysis;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProject;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProjectArchitectureExperience;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProjectKeyword;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProjectTech;
import com.portmatch.domain.portfolio.repository.PortfolioAnalysisRepository;
import com.portmatch.domain.portfolio.repository.PortfolioRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PortfolioEmbeddingService {

    private final PortfolioRepository portfolioRepository;
    private final PortfolioAnalysisRepository analysisRepository;
    private final PortfolioProjectEmbeddingRepository embeddingRepository;
    private final PortfolioUserTechEmbeddingRepository userTechEmbeddingRepository;
    private final PortfolioUserKeywordEmbeddingRepository userKeywordEmbeddingRepository;
    private final PortfolioUserArchitectureEmbeddingRepository userArchitectureEmbeddingRepository;
    private final PortfolioUserUnifiedEmbeddingRepository userUnifiedEmbeddingRepository;
    private final PortfolioAnalysisClient embeddingClient;

    public PortfolioEmbeddingService(
            PortfolioRepository portfolioRepository,
            PortfolioAnalysisRepository analysisRepository,
            PortfolioProjectEmbeddingRepository embeddingRepository,
            PortfolioUserTechEmbeddingRepository userTechEmbeddingRepository,
            PortfolioUserKeywordEmbeddingRepository userKeywordEmbeddingRepository,
            PortfolioUserArchitectureEmbeddingRepository userArchitectureEmbeddingRepository,
            PortfolioUserUnifiedEmbeddingRepository userUnifiedEmbeddingRepository,
            PortfolioAnalysisClient embeddingClient
    ) {
        this.portfolioRepository = portfolioRepository;
        this.analysisRepository = analysisRepository;
        this.embeddingRepository = embeddingRepository;
        this.userTechEmbeddingRepository = userTechEmbeddingRepository;
        this.userKeywordEmbeddingRepository = userKeywordEmbeddingRepository;
        this.userArchitectureEmbeddingRepository = userArchitectureEmbeddingRepository;
        this.userUnifiedEmbeddingRepository = userUnifiedEmbeddingRepository;
        this.embeddingClient = embeddingClient;
    }

    public void buildForMyPortfolio(Long userId, Long portfolioId) {
        // 1) 소유권 체크
        Portfolio portfolio = portfolioRepository.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio not found"));

        // 2) 분석 결과 로드 (현재 구현은 portfolioId로 fetch)
        PortfolioAnalysis analysis;
        try {
            analysis = analysisRepository.findWithProjectsByPortfolioId(portfolio.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio analysis not found"));
        } catch (RuntimeException e) {
            throw e;
        }

        List<PortfolioAnalysisProject> projects;
        try {
            projects = analysis.getProjects();
        } catch (RuntimeException e) {
            throw e;
        }
        if (projects == null || projects.isEmpty()) {
            return;
        }

        // 2.5) 기존 임베딩 제거 (포트폴리오 단위 재생성)
        userTechEmbeddingRepository.deleteByPortfolioId(portfolioId);
        userKeywordEmbeddingRepository.deleteByPortfolioId(portfolioId);
        userArchitectureEmbeddingRepository.deleteByPortfolioId(portfolioId);
        userUnifiedEmbeddingRepository.deleteByPortfolioId(portfolioId);
        embeddingRepository.deleteByPortfolioId(portfolioId);

        // 3) 프로젝트별 content 생성 + content_hash
        List<Long> projectIds = new ArrayList<>();
        List<String> contents = new ArrayList<>();
        List<String> hashes = new ArrayList<>();
        List<String> textsToEmbed = new ArrayList<>();
        List<FieldEmbeddingIndices> embeddingIndices = new ArrayList<>();
        List<FieldMissingFlags> missingFlags = new ArrayList<>();
        List<String> techItems = new ArrayList<>();
        List<String> keywordItems = new ArrayList<>();
        List<String> architectureItems = new ArrayList<>();

        for (PortfolioAnalysisProject p : projects) {
            projectIds.add(p.getId());

            List<String> techs = (p.getTechs() == null) ? List.of()
                    : p.getTechs().stream()
                    .map(PortfolioAnalysisProjectTech::getTech)
                    .filter(t -> t != null && !t.isBlank())
                    .toList();

            String techStr = techs.isEmpty()
                    ? "N/A"
                    : techs.stream().map(String::trim).filter(s -> !s.isBlank()).collect(Collectors.joining(", "));

            List<String> keywords = (p.getKeywords() == null) ? List.of()
                    : p.getKeywords().stream()
                    .map(PortfolioAnalysisProjectKeyword::getKeyword)
                    .filter(k -> k != null && !k.isBlank())
                    .toList();

            List<String> architectureExperiences = (p.getArchitectureExperiences() == null) ? List.of()
                    : p.getArchitectureExperiences().stream()
                    .map(PortfolioAnalysisProjectArchitectureExperience::getArchitectureExperience)
                    .filter(a -> a != null && !a.isBlank())
                    .toList();

            techItems.addAll(techs);
            keywordItems.addAll(keywords);
            architectureItems.addAll(architectureExperiences);

            String content = buildProjectEmbeddingText(
                    p.getName(),
                    p.getDomain(),
                    p.getProblem(),
                    p.getSolution(),
                    techs
            );

            contents.add(content);
            hashes.add(sha256Hex(content));

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

        // 4) Portfolio-Analysis로 배치 임베딩 요청
        PortfolioEmbeddingResponse resp = embeddingClient.embed(
                new PortfolioEmbeddingRequest(textsToEmbed)
        );

        if (resp.vectors() == null || resp.vectors().size() != textsToEmbed.size()) {
            throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_SIZE_MISMATCH);
        }

        // 5) upsert + 상세 결과 만들기
        for (int i = 0; i < projectIds.size(); i++) {
            Long projectId = projectIds.get(i);
            String content = contents.get(i);
            String contentHash = hashes.get(i);
            FieldEmbeddingIndices indices = embeddingIndices.get(i);
            FieldMissingFlags flags = missingFlags.get(i);

            String projectVector = toVectorString(resp.vectors().get(indices.projectIdx()));
            String domainVector = toVectorString(resp.vectors().get(indices.domainIdx()));
            String problemVector = toVectorString(resp.vectors().get(indices.problemIdx()));
            String solutionVector = toVectorString(resp.vectors().get(indices.solutionIdx()));
            String techVector = toVectorString(resp.vectors().get(indices.techIdx()));

            Optional<PortfolioProjectEmbedding> existingOpt = embeddingRepository.findByProjectId(projectId);

            if (existingOpt.isPresent() && contentHash.equals(existingOpt.get().getContentHash())) {
                continue;
            }

            embeddingRepository.upsertByProjectId(
                    portfolioId,
                    analysis.getId(),
                    projectId,
                    content,
                    contentHash,
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

        techItems = techItems.stream().map(String::trim).filter(s -> !s.isBlank()).distinct().toList();
        keywordItems = keywordItems.stream().map(String::trim).filter(s -> !s.isBlank()).distinct().toList();
        architectureItems = architectureItems.stream().map(String::trim).filter(s -> !s.isBlank()).distinct().toList();

        if (!techItems.isEmpty()) {
            PortfolioEmbeddingResponse techResp = embeddingClient.embedTags(
                    new PortfolioEmbeddingRequest(techItems)
            );
            if (techResp.vectors() == null || techResp.vectors().size() != techItems.size()) {
                throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_SIZE_MISMATCH);
            }
            for (int i = 0; i < techItems.size(); i++) {
                String vector = toVectorString(techResp.vectors().get(i));
                userTechEmbeddingRepository.upsertTechEmbedding(
                        userId,
                        portfolioId,
                        techItems.get(i),
                        vector
                );
            }
        }

        if (!keywordItems.isEmpty()) {
            PortfolioEmbeddingResponse keywordResp = embeddingClient.embedTags(
                    new PortfolioEmbeddingRequest(keywordItems)
            );
            if (keywordResp.vectors() == null || keywordResp.vectors().size() != keywordItems.size()) {
                throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_SIZE_MISMATCH);
            }
            for (int i = 0; i < keywordItems.size(); i++) {
                String vector = toVectorString(keywordResp.vectors().get(i));
                userKeywordEmbeddingRepository.upsertKeywordEmbedding(
                        userId,
                        portfolioId,
                        keywordItems.get(i),
                        vector
                );
            }
        }

        if (!architectureItems.isEmpty()) {
            PortfolioEmbeddingResponse architectureResp = embeddingClient.embedTags(
                    new PortfolioEmbeddingRequest(architectureItems)
            );
            if (architectureResp.vectors() == null || architectureResp.vectors().size() != architectureItems.size()) {
                throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_SIZE_MISMATCH);
            }
            for (int i = 0; i < architectureItems.size(); i++) {
                String vector = toVectorString(architectureResp.vectors().get(i));
                userArchitectureEmbeddingRepository.upsertArchitectureEmbedding(
                        userId,
                        portfolioId,
                        architectureItems.get(i),
                        vector
                );
            }
        }

        // 6) 통합 임베딩 생성: 모든 기술/키워드/아키텍처 경험을 하나의 텍스트로 결합
        String unifiedText = buildUnifiedExperienceText(techItems, keywordItems, architectureItems, projects);
        PortfolioEmbeddingResponse unifiedResp = embeddingClient.embedTags(
                new PortfolioEmbeddingRequest(List.of(unifiedText))
        );
        if (unifiedResp.vectors() == null || unifiedResp.vectors().isEmpty()) {
            throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_SIZE_MISMATCH);
        }
        String unifiedVector = toVectorString(unifiedResp.vectors().get(0));
        userUnifiedEmbeddingRepository.upsertUnifiedEmbedding(
                userId,
                portfolioId,
                unifiedText,
                unifiedVector
        );
    }

    private String buildUnifiedExperienceText(
            List<String> techItems,
            List<String> keywordItems,
            List<String> architectureItems,
            List<PortfolioAnalysisProject> projects
    ) {
        StringBuilder sb = new StringBuilder();
        
        // 기술 스택
        if (!techItems.isEmpty()) {
            sb.append("[기술] ").append(String.join(", ", techItems)).append("\n");
        }
        
        // 키워드/역량
        if (!keywordItems.isEmpty()) {
            sb.append("[역량] ").append(String.join(", ", keywordItems)).append("\n");
        }
        
        // 아키텍처 경험
        if (!architectureItems.isEmpty()) {
            sb.append("[아키텍처 경험] ").append(String.join("; ", architectureItems)).append("\n");
        }
        
        // 프로젝트별 문제-해결 요약
        for (PortfolioAnalysisProject p : projects) {
            String problem = safe(p.getProblem());
            String solution = safe(p.getSolution());
            if (!problem.equals("정보 없음") || !solution.equals("정보 없음")) {
                sb.append("[프로젝트] ").append(safe(p.getName())).append(": ");
                if (!problem.equals("정보 없음")) {
                    sb.append(problem);
                }
                if (!solution.equals("정보 없음")) {
                    sb.append(" → ").append(solution);
                }
                sb.append("\n");
            }
        }
        
        return sb.toString().trim();
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

    private String sha256Hex(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(text.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
