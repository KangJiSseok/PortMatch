package com.portmatch.domain.portfolio.embedding.service;

import com.portmatch.domain.portfolio.embedding.client.PortfolioAnalysisClient;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingRequest;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingResponse;
import com.portmatch.domain.portfolio.embedding.entity.PortfolioProjectEmbedding;
import com.portmatch.domain.portfolio.embedding.entity.PortfolioProjectTagEmbedding;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioProjectEmbeddingRepository;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioProjectTagEmbeddingRepository;
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
import lombok.extern.slf4j.Slf4j;
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

@Slf4j
@Service
@Transactional
public class PortfolioEmbeddingService {

    private final PortfolioRepository portfolioRepository;
    private final PortfolioAnalysisRepository analysisRepository;
    private final PortfolioProjectEmbeddingRepository embeddingRepository;
    private final PortfolioProjectTagEmbeddingRepository tagEmbeddingRepository;
    private final PortfolioAnalysisClient embeddingClient;

    public PortfolioEmbeddingService(
            PortfolioRepository portfolioRepository,
            PortfolioAnalysisRepository analysisRepository,
            PortfolioProjectEmbeddingRepository embeddingRepository,
            PortfolioProjectTagEmbeddingRepository tagEmbeddingRepository,
            PortfolioAnalysisClient embeddingClient
    ) {
        this.portfolioRepository = portfolioRepository;
        this.analysisRepository = analysisRepository;
        this.embeddingRepository = embeddingRepository;
        this.tagEmbeddingRepository = tagEmbeddingRepository;
        this.embeddingClient = embeddingClient;
    }

    public void buildForMyPortfolio(Long userId, Long portfolioId) {
        log.info("[portfolio-embedding] start userId={} portfolioId={}", userId, portfolioId);
        // 1) 소유권 체크
        Portfolio portfolio = portfolioRepository.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio not found"));

        // 2) 분석 결과 로드 (현재 구현은 portfolioId로 fetch)
        PortfolioAnalysis analysis;
        try {
            log.info("[portfolio-embedding] fetch analysis start portfolioId={}", portfolioId);
            analysis = analysisRepository.findWithProjectsByPortfolioId(portfolio.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio analysis not found"));
            log.info("[portfolio-embedding] fetch analysis done analysisId={}", analysis.getId());
        } catch (RuntimeException e) {
            log.error("[portfolio-embedding] fetch analysis failed portfolioId={}", portfolioId, e);
            throw e;
        }

        List<PortfolioAnalysisProject> projects;
        try {
            projects = analysis.getProjects();
            log.info("[portfolio-embedding] fetched projects analysisId={} projects={}",
                    analysis.getId(), projects == null ? 0 : projects.size());
        } catch (RuntimeException e) {
            log.error("[portfolio-embedding] fetch projects failed analysisId={}", analysis.getId(), e);
            throw e;
        }
        if (projects == null || projects.isEmpty()) {
            log.info("[portfolio-embedding] skip empty projects portfolioId={}", portfolioId);
            return;
        }

        // 2.5) 기존 임베딩 제거 (포트폴리오 단위 재생성)
        tagEmbeddingRepository.deleteByPortfolioId(portfolioId);
        embeddingRepository.deleteByPortfolioId(portfolioId);

        // 3) 프로젝트별 content 생성 + content_hash
        List<Long> projectIds = new ArrayList<>();
        List<String> contents = new ArrayList<>();
        List<String> hashes = new ArrayList<>();
        List<String> textsToEmbed = new ArrayList<>();
        List<FieldEmbeddingIndices> embeddingIndices = new ArrayList<>();
        List<FieldMissingFlags> missingFlags = new ArrayList<>();
        List<String> tagContents = new ArrayList<>();
        List<String> tagHashes = new ArrayList<>();
        List<String> tagTexts = new ArrayList<>();
        List<TagEmbeddingIndices> tagEmbeddingIndices = new ArrayList<>();
        List<TagMissingFlags> tagMissingFlags = new ArrayList<>();

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

            String keywordStr = buildTagString(keywords);
            String architectureStr = buildTagString(architectureExperiences);

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

            String tagContent = buildTagEmbeddingText(techStr, keywordStr, architectureStr);
            tagContents.add(tagContent);
            tagHashes.add(sha256Hex(tagContent));

            int techTextIdx = tagTexts.size();
            tagTexts.add(techStr.isBlank() ? "정보 없음" : techStr);
            int keywordTextIdx = tagTexts.size();
            tagTexts.add(keywordStr);
            int architectureTextIdx = tagTexts.size();
            tagTexts.add(architectureStr);

            tagEmbeddingIndices.add(new TagEmbeddingIndices(
                    techTextIdx,
                    keywordTextIdx,
                    architectureTextIdx
            ));
            tagMissingFlags.add(new TagMissingFlags(
                    techs.isEmpty(),
                    keywords.isEmpty(),
                    architectureExperiences.isEmpty()
            ));
        }

        // 4) Portfolio-Analysis로 배치 임베딩 요청
        log.info("[portfolio-embedding] request embeddings texts={}", textsToEmbed.size());
        PortfolioEmbeddingResponse resp = embeddingClient.embed(
                new PortfolioEmbeddingRequest(textsToEmbed)
        );

        if (resp.vectors() == null || resp.vectors().size() != textsToEmbed.size()) {
            throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_SIZE_MISMATCH);
        }
        log.info("[portfolio-embedding] response embeddings size={}", resp.vectors().size());

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

        if (!tagTexts.isEmpty()) {
            log.info("[portfolio-embedding] request tag embeddings texts={}", tagTexts.size());
            PortfolioEmbeddingResponse tagResp = embeddingClient.embedTags(
                    new PortfolioEmbeddingRequest(tagTexts)
            );

            if (tagResp.vectors() == null || tagResp.vectors().size() != tagTexts.size()) {
                throw new BusinessException(ResponseCode.PORTFOLIO_EMBEDDING_SIZE_MISMATCH);
            }

            for (int i = 0; i < projectIds.size(); i++) {
                Long projectId = projectIds.get(i);
                String content = tagContents.get(i);
                String contentHash = tagHashes.get(i);
                TagEmbeddingIndices indices = tagEmbeddingIndices.get(i);
                TagMissingFlags flags = tagMissingFlags.get(i);

                String techVector = toVectorString(tagResp.vectors().get(indices.techIdx()));
                String keywordVector = toVectorString(tagResp.vectors().get(indices.keywordIdx()));
                String architectureVector = toVectorString(tagResp.vectors().get(indices.architectureIdx()));

                Optional<PortfolioProjectTagEmbedding> existingOpt = tagEmbeddingRepository.findByProjectId(projectId);
                if (existingOpt.isPresent() && contentHash.equals(existingOpt.get().getContentHash())) {
                    continue;
                }

                tagEmbeddingRepository.upsertByProjectId(
                        portfolioId,
                        analysis.getId(),
                        projectId,
                        content,
                        contentHash,
                        techVector,
                        keywordVector,
                        architectureVector,
                        flags.techMissing(),
                        flags.keywordMissing(),
                        flags.architectureMissing()
                );
            }
        }
        log.info("[portfolio-embedding] done portfolioId={} projects={}", portfolioId, projectIds.size());
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

    private record TagEmbeddingIndices(
            int techIdx,
            int keywordIdx,
            int architectureIdx
    ) {
    }

    private record TagMissingFlags(
            boolean techMissing,
            boolean keywordMissing,
            boolean architectureMissing
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

    private String buildTagEmbeddingText(String techStr, String keywordStr, String architectureStr) {
        return ""
                + "[기술] " + techStr + "\n"
                + "[키워드] " + keywordStr + "\n"
                + "[아키텍처] " + architectureStr;
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

    private String buildTagString(List<String> items) {
        if (items == null || items.isEmpty()) {
            return "정보 없음";
        }
        String joined = items.stream().map(String::trim).filter(s -> !s.isBlank()).collect(Collectors.joining(", "));
        return joined.isBlank() ? "정보 없음" : joined;
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
