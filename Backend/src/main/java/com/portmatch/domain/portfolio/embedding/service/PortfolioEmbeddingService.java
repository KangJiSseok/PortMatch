package com.portmatch.domain.portfolio.embedding.service;

import com.portmatch.domain.portfolio.embedding.client.PortfolioAnalysisClient;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingRequest;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingResponse;
import com.portmatch.domain.portfolio.embedding.entity.PortfolioProjectEmbedding;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioProjectEmbeddingRepository;
import com.portmatch.domain.portfolio.entity.Portfolio;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysis;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProject;
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
    private final PortfolioAnalysisClient embeddingClient;

    public PortfolioEmbeddingService(
            PortfolioRepository portfolioRepository,
            PortfolioAnalysisRepository analysisRepository,
            PortfolioProjectEmbeddingRepository embeddingRepository,
            PortfolioAnalysisClient embeddingClient
    ) {
        this.portfolioRepository = portfolioRepository;
        this.analysisRepository = analysisRepository;
        this.embeddingRepository = embeddingRepository;
        this.embeddingClient = embeddingClient;
    }

    public void buildForMyPortfolio(Long userId, Long portfolioId) {
        // 1) ?뚯쑀沅?泥댄겕
        Portfolio portfolio = portfolioRepository.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio not found"));

        // 2) 遺꾩꽍 寃곌낵 濡쒕뱶 (?꾩옱 援ы쁽??留욎떠 portfolioId濡?fetch)
        PortfolioAnalysis analysis = analysisRepository.findWithProjectsByPortfolioId(portfolio.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio analysis not found"));

        List<PortfolioAnalysisProject> projects = analysis.getProjects();
        if (projects == null || projects.isEmpty()) {
            return;
        }

        // 3) ?꾨줈?앺듃蹂?content ?앹꽦 + content_hash
        List<Long> projectIds = new ArrayList<>();
        List<String> contents = new ArrayList<>();
        List<String> hashes = new ArrayList<>();
        List<String> textsToEmbed = new ArrayList<>();
        List<FieldEmbeddingIndices> embeddingIndices = new ArrayList<>();
        List<FieldMissingFlags> missingFlags = new ArrayList<>();

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

            String content = buildProjectEmbeddingText(
                    p.getName(),
                    p.getProblem(),
                    p.getSolution(),
                    techs
            );

            contents.add(content);
            hashes.add(sha256Hex(content));

            int projectIdx = textsToEmbed.size();
            textsToEmbed.add(buildFieldEmbeddingText("project", p.getName()));

            int problemIdx = textsToEmbed.size();
            textsToEmbed.add(buildFieldEmbeddingText("problem", p.getProblem()));

            int solutionIdx = textsToEmbed.size();
            textsToEmbed.add(buildFieldEmbeddingText("solution", p.getSolution()));

            int techIdx = textsToEmbed.size();
            textsToEmbed.add(buildFieldEmbeddingText("tech", techStr));

            embeddingIndices.add(new FieldEmbeddingIndices(
                    projectIdx,
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

        // 4) Portfolio-Analysis濡?諛곗튂 ?꾨쿋???붿껌
        PortfolioEmbeddingResponse resp = embeddingClient.embed(
                new PortfolioEmbeddingRequest(textsToEmbed)
        );

        if (resp.vectors() == null || resp.vectors().size() != textsToEmbed.size()) {
            throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_SIZE_MISMATCH);
        }

        // 5) upsert + ?곸꽭 寃곌낵 留뚮뱾湲?
        for (int i = 0; i < projectIds.size(); i++) {
            Long projectId = projectIds.get(i);
            String content = contents.get(i);
            String contentHash = hashes.get(i);
            FieldEmbeddingIndices indices = embeddingIndices.get(i);
            FieldMissingFlags flags = missingFlags.get(i);

            String projectVector = toVectorString(resp.vectors().get(indices.projectIdx()));
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
                    problemVector,
                    solutionVector,
                    techVector,
                    flags.problemMissing(),
                    flags.solutionMissing(),
                    flags.techMissing()
            );
        }
    }

    private record FieldEmbeddingIndices(
            int projectIdx,
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

