package com.portmatch.domain.portfolio.embedding.service;

import com.portmatch.domain.portfolio.embedding.client.PortfolioAnalysisClient;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingRequest;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingResponse;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingUpsertResult;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioEmbeddingUpsertResult.Action;
import com.portmatch.domain.portfolio.embedding.entity.PortfolioProjectEmbedding;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioProjectEmbeddingRepository;
import com.portmatch.domain.portfolio.entity.Portfolio;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysis;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProject;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProjectTech;
import com.portmatch.domain.portfolio.repository.PortfolioAnalysisRepository;
import com.portmatch.domain.portfolio.repository.PortfolioRepository;
import org.springframework.beans.factory.annotation.Value;
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

    private final String embeddingModel;

    public PortfolioEmbeddingService(
            PortfolioRepository portfolioRepository,
            PortfolioAnalysisRepository analysisRepository,
            PortfolioProjectEmbeddingRepository embeddingRepository,
            PortfolioAnalysisClient embeddingClient,
            @Value("${portfolio-embedding.model:text-embedding-3-small}") String embeddingModel
    ) {
        this.portfolioRepository = portfolioRepository;
        this.analysisRepository = analysisRepository;
        this.embeddingRepository = embeddingRepository;
        this.embeddingClient = embeddingClient;
        this.embeddingModel = embeddingModel;
    }

    public PortfolioEmbeddingUpsertResult buildForMyPortfolio(Long userId, Long portfolioId) {
        // 1) 소유권 체크
        Portfolio portfolio = portfolioRepository.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio not found"));

        // 2) 분석 결과 로드 (현재 구현에 맞춰 portfolioId로 fetch)
        PortfolioAnalysis analysis = analysisRepository.findWithProjectsByPortfolioId(portfolio.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Portfolio analysis not found"));

        List<PortfolioAnalysisProject> projects = analysis.getProjects();
        if (projects == null || projects.isEmpty()) {
            return new PortfolioEmbeddingUpsertResult(
                    portfolioId,
                    analysis.getId(),
                    0, 0, 0, 0,
                    List.of()
            );
        }

        // 3) 프로젝트별 content 생성 + content_hash
        List<Long> projectIds = new ArrayList<>();
        List<String> contents = new ArrayList<>();
        List<String> hashes = new ArrayList<>();

        for (PortfolioAnalysisProject p : projects) {
            projectIds.add(p.getId());

            List<String> techs = (p.getTechs() == null) ? List.of()
                    : p.getTechs().stream()
                    .map(PortfolioAnalysisProjectTech::getTech)
                    .filter(t -> t != null && !t.isBlank())
                    .toList();

            String content = buildProjectEmbeddingText(
                    p.getName(),
                    p.getProblem(),
                    p.getSolution(),
                    techs
            );

            contents.add(content);
            hashes.add(sha256Hex(content));
        }

        // 4) Portfolio-Analysis로 배치 임베딩 요청
        PortfolioEmbeddingResponse resp = embeddingClient.embed(
                new PortfolioEmbeddingRequest(contents, embeddingModel)
        );

        if (resp.vectors() == null || resp.vectors().size() != contents.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Embedding response size mismatch");
        }

        // 5) upsert + 상세 결과 만들기
        int inserted = 0, updated = 0, skipped = 0;
        List<PortfolioEmbeddingUpsertResult.Detail> details = new ArrayList<>();

        for (int i = 0; i < projectIds.size(); i++) {
            Long projectId = projectIds.get(i);
            String content = contents.get(i);
            String contentHash = hashes.get(i);

            Optional<PortfolioProjectEmbedding> existingOpt = embeddingRepository.findByProjectId(projectId);

            if (existingOpt.isPresent()) {
                // 같은 hash면 스킵
                if (contentHash.equals(existingOpt.get().getContentHash())) {
                    skipped++;
                    details.add(new PortfolioEmbeddingUpsertResult.Detail(projectId, Action.SKIPPED, "content_hash unchanged"));
                    continue;
                }

                // 업데이트
                embeddingRepository.upsertByProjectId(
                        portfolioId,
                        analysis.getId(),
                        projectId,
                        content,
                        contentHash,
                        toVectorString(resp.vectors().get(i))
                );
                updated++;
                details.add(new PortfolioEmbeddingUpsertResult.Detail(projectId, Action.UPDATED, null));
            } else {
                // 신규
                embeddingRepository.upsertByProjectId(
                        portfolioId,
                        analysis.getId(),
                        projectId,
                        content,
                        contentHash,
                        toVectorString(resp.vectors().get(i))
                );
                inserted++;
                details.add(new PortfolioEmbeddingUpsertResult.Detail(projectId, Action.INSERTED, null));
            }
        }

        return new PortfolioEmbeddingUpsertResult(
                portfolioId,
                analysis.getId(),
                projectIds.size(),
                inserted,
                updated,
                skipped,
                details
        );
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
