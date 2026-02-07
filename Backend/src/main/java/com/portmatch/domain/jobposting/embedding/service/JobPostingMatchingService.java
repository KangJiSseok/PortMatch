package com.portmatch.domain.jobposting.embedding.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portmatch.domain.jobposting.embedding.dto.JobPostingMatchResponse;
import com.portmatch.domain.jobposting.embedding.entity.JobPostingEmbedding;
import com.portmatch.domain.jobposting.embedding.repository.JobPostingEmbeddingRepository;
import com.portmatch.domain.jobposting.embedding.repository.JobPostingMatchRow;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioProjectEmbeddingRepository;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioUserJobPostingEmbeddingRepository;
import com.portmatch.domain.portfolio.entity.Portfolio;
import com.portmatch.domain.portfolio.repository.PortfolioRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class JobPostingMatchingService {

    private final PortfolioRepository portfolioRepository;
    private final PortfolioUserJobPostingEmbeddingRepository userJobPostingEmbeddingRepository;
    private final PortfolioProjectEmbeddingRepository projectEmbeddingRepository;
    private final JobPostingEmbeddingRepository jobPostingEmbeddingRepository;
    private final JobPostingRepository jobPostingRepository;
    private final ObjectMapper objectMapper;

    // 가중치 설정
    private static final double NAME_WEIGHT = 0.10;
    private static final double DOMAIN_WEIGHT = 0.15;
    private static final double TECH_WEIGHT = 0.15;
    private static final double PROBLEM_WEIGHT = 0.25;
    private static final double ARCHITECTURE_WEIGHT = 0.35;
    private static final double ARCHITECTURE_MISSING_PENALTY = 0.2;
    private static final double TECH_MISSING_PENALTY = 0.2;
    private static final double PROBLEM_MISSING_PENALTY = 0.2;

    public JobPostingMatchingService(
            PortfolioRepository portfolioRepository,
            PortfolioUserJobPostingEmbeddingRepository userJobPostingEmbeddingRepository,
            PortfolioProjectEmbeddingRepository projectEmbeddingRepository,
            JobPostingEmbeddingRepository jobPostingEmbeddingRepository,
            JobPostingRepository jobPostingRepository,
            ObjectMapper objectMapper
    ) {
        this.portfolioRepository = portfolioRepository;
        this.userJobPostingEmbeddingRepository = userJobPostingEmbeddingRepository;
        this.projectEmbeddingRepository = projectEmbeddingRepository;
        this.jobPostingEmbeddingRepository = jobPostingEmbeddingRepository;
        this.jobPostingRepository = jobPostingRepository;
        this.objectMapper = objectMapper;
    }

    public JobPostingMatchResponse matchByPortfolioId(Long userId, Long portfolioId, int limit) {
        // 1. 포트폴리오 소유권 확인
        Portfolio portfolio = portfolioRepository.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.PORTFOLIO_NOT_FOUND));

        // 2. 포트폴리오 사용자 임베딩 존재 여부 확인
        if (!userJobPostingEmbeddingRepository.existsByPortfolioId(portfolioId)) {
            return new JobPostingMatchResponse(List.of());
        }

        int candidateLimit = Math.max(limit * 5, limit);
        List<Long> candidateIds = jobPostingEmbeddingRepository.findTopCandidateJobPostingIdsByPortfolioId(
                portfolioId,
                NAME_WEIGHT,
                DOMAIN_WEIGHT,
                TECH_WEIGHT,
                PROBLEM_WEIGHT,
                ARCHITECTURE_WEIGHT,
                TECH_MISSING_PENALTY,
                PROBLEM_MISSING_PENALTY,
                ARCHITECTURE_MISSING_PENALTY,
                candidateLimit
        );

        if (candidateIds.isEmpty()) {
            return new JobPostingMatchResponse(List.of());
        }

        List<JobPostingMatchRow> matchRows;
        if (!projectEmbeddingRepository.existsByPortfolioId(portfolioId)) {
            return new JobPostingMatchResponse(List.of());
        }

        matchRows = jobPostingEmbeddingRepository.findRefinedMatchesByPortfolioIdAndJobPostingIds(
                portfolioId,
                candidateIds,
                NAME_WEIGHT,
                DOMAIN_WEIGHT,
                TECH_WEIGHT,
                PROBLEM_WEIGHT,
                ARCHITECTURE_WEIGHT,
                TECH_MISSING_PENALTY,
                PROBLEM_MISSING_PENALTY,
                ARCHITECTURE_MISSING_PENALTY,
                limit
        );

        if (matchRows.isEmpty()) {
            return new JobPostingMatchResponse(List.of());
        }

        List<JobPostingEmbedding> jobPostingEmbeddings =
                jobPostingEmbeddingRepository.findAllByJobPostingIdIn(
                        matchRows.stream().map(JobPostingMatchRow::getJobPostingId).toList()
                );

        Map<Long, JobPostingEmbedding> embeddingMap = jobPostingEmbeddings.stream()
                .collect(Collectors.toMap(JobPostingEmbedding::getJobPostingId, e -> e));

        // 4. 유사도 결과 매핑
        List<ScoredJobPosting> scoredList = new ArrayList<>();

        for (JobPostingMatchRow row : matchRows) {
            JobPostingEmbedding jobEmb = embeddingMap.get(row.getJobPostingId());
            if (jobEmb == null) {
                continue;
            }

            scoredList.add(new ScoredJobPosting(
                    jobEmb,
                    row.getSimilarity() != null ? row.getSimilarity() : 0.0,
                    row.getDomainSimilarity() != null ? row.getDomainSimilarity() : 0.0,
                    row.getTechSimilarity() != null ? row.getTechSimilarity() : 0.0,
                    row.getProblemSimilarity() != null ? row.getProblemSimilarity() : 0.0,
                    row.getArchitectureSimilarity() != null ? row.getArchitectureSimilarity() : 0.0,
                    row.getPortfolioContent()
            ));
        }

        // 5. 상위 N개 추출
        List<JobPostingMatchResponse.MatchedJobPosting> matches = scoredList.stream()
                .sorted(Comparator.comparingDouble(ScoredJobPosting::similarity).reversed())
                .limit(limit)
                .map(this::toMatchedJobPosting)
                .toList();

        return new JobPostingMatchResponse(matches);
    }

    private JobPostingMatchResponse.MatchedJobPosting toMatchedJobPosting(ScoredJobPosting scored) {
        JobPostingEmbedding emb = scored.embedding();
        
        // 공고 정보 조회
        Optional<JobPostingEntity> jobPostingOpt = jobPostingRepository.findById(emb.getJobPostingId());
        String title = jobPostingOpt.map(JobPostingEntity::getTitle).orElse("");
        String companyName = jobPostingOpt
                .map(jp -> jp.getCompany() != null ? jp.getCompany().getCompaniesName() : "")
                .orElse("");
        
        String portfolioContent = scored.portfolioContent() != null ? scored.portfolioContent() : "";
        String jobPostingContent = formatJobPostingContent(emb);

        return new JobPostingMatchResponse.MatchedJobPosting(
                emb.getJobPostingId(),
                title,
                companyName,
                emb.getProblem(),
                emb.getSolution(),
                scored.similarity(),
                scored.domainSim(),
                scored.techSim(),
                scored.problemSim(),
                scored.architectureSim(),
                portfolioContent,
                jobPostingContent
        );
    }

    private String formatJobPostingContent(JobPostingEmbedding emb) {
        StringBuilder sb = new StringBuilder();
        
        sb.append("[프로젝트명] ").append(safe(emb.getName())).append("\n");
        sb.append("[도메인] ").append(safe(emb.getDomain())).append("\n");
        sb.append("[문제] ").append(safe(emb.getProblem())).append("\n");
        
        // tech 파싱
        List<String> techList = parseJsonArray(emb.getTech());
        String techStr = techList.isEmpty() ? "정보 없음" : String.join(", ", techList);
        sb.append("[기술] ").append(techStr).append("\n");
        
        // architecture 파싱
        List<String> archList = parseJsonArray(emb.getArchitectureExperience());
        String archStr = archList.isEmpty() ? "정보 없음" : String.join("; ", archList);
        sb.append("[아키텍처] ").append(archStr);
        
        return sb.toString();
    }

    private String safe(String s) {
        if (s == null || s.isBlank()) {
            return "정보 없음";
        }
        return s.trim();
    }

    private List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    private record ScoredJobPosting(
            JobPostingEmbedding embedding,
            double similarity,
            double domainSim,
            double techSim,
            double problemSim,
            double architectureSim,
            String portfolioContent
    ) {}
}
