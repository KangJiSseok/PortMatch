package com.portmatch.domain.jobposting.embedding.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portmatch.domain.jobposting.embedding.dto.JobPostingMatchResponse;
import com.portmatch.domain.jobposting.embedding.entity.JobPostingEmbedding;
import com.portmatch.domain.jobposting.embedding.repository.JobPostingEmbeddingRepository;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import com.portmatch.domain.portfolio.embedding.entity.PortfolioProjectJobPostingEmbedding;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioProjectJobPostingEmbeddingRepository;
import com.portmatch.domain.portfolio.entity.Portfolio;
import com.portmatch.domain.portfolio.repository.PortfolioRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class JobPostingMatchingService {

    private final PortfolioRepository portfolioRepository;
    private final PortfolioProjectJobPostingEmbeddingRepository projectEmbeddingRepository;
    private final JobPostingEmbeddingRepository jobPostingEmbeddingRepository;
    private final JobPostingRepository jobPostingRepository;
    private final ObjectMapper objectMapper;

    // 가중치 설정
    private static final double DOMAIN_WEIGHT = 0.15;
    private static final double TECH_WEIGHT = 0.25;
    private static final double PROBLEM_WEIGHT = 0.15;
    private static final double SOLUTION_WEIGHT = 0.15;
    private static final double ARCHITECTURE_WEIGHT = 0.15;
    private static final double KEYWORDS_WEIGHT = 0.15;

    public JobPostingMatchingService(
            PortfolioRepository portfolioRepository,
            PortfolioProjectJobPostingEmbeddingRepository projectEmbeddingRepository,
            JobPostingEmbeddingRepository jobPostingEmbeddingRepository,
            JobPostingRepository jobPostingRepository,
            ObjectMapper objectMapper
    ) {
        this.portfolioRepository = portfolioRepository;
        this.projectEmbeddingRepository = projectEmbeddingRepository;
        this.jobPostingEmbeddingRepository = jobPostingEmbeddingRepository;
        this.jobPostingRepository = jobPostingRepository;
        this.objectMapper = objectMapper;
    }

    public JobPostingMatchResponse matchByPortfolioId(Long userId, Long portfolioId, int limit) {
        // 1. 포트폴리오 소유권 확인
        Portfolio portfolio = portfolioRepository.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.PORTFOLIO_NOT_FOUND));

        // 2. 포트폴리오의 프로젝트 임베딩 조회
        List<PortfolioProjectJobPostingEmbedding> projectEmbeddings = 
                projectEmbeddingRepository.findAllByPortfolioId(portfolioId);

        if (projectEmbeddings.isEmpty()) {
            return new JobPostingMatchResponse(List.of());
        }

        // 3. 모든 공고 임베딩 조회 (임베딩이 있는 것만)
        List<JobPostingEmbedding> jobPostingEmbeddings = 
                jobPostingEmbeddingRepository.findAllWithEmbeddings();

        if (jobPostingEmbeddings.isEmpty()) {
            return new JobPostingMatchResponse(List.of());
        }

        // 4. 유사도 계산
        List<ScoredJobPosting> scoredList = new ArrayList<>();

        for (JobPostingEmbedding jobEmb : jobPostingEmbeddings) {
            double bestSimilarity = 0;
            double bestDomain = 0, bestTech = 0, bestProblem = 0, bestSolution = 0;
            double bestArchitecture = 0, bestKeywords = 0;
            String bestPortfolioContent = "";

            // 각 프로젝트와 비교하여 가장 높은 유사도 선택
            for (PortfolioProjectJobPostingEmbedding projEmb : projectEmbeddings) {
                double domainSim = cosineSimilarity(projEmb.getDomainEmbedding(), jobEmb.getDomainEmbedding());
                double techSim = cosineSimilarity(projEmb.getTechEmbedding(), jobEmb.getTechEmbedding());
                double problemSim = cosineSimilarity(projEmb.getProblemEmbedding(), jobEmb.getProblemEmbedding());
                double solutionSim = cosineSimilarity(projEmb.getSolutionEmbedding(), jobEmb.getSolutionEmbedding());
                double archSim = cosineSimilarity(projEmb.getArchitectureEmbedding(), jobEmb.getArchitectureEmbedding());
                double keywordsSim = cosineSimilarity(projEmb.getKeywordsEmbedding(), jobEmb.getKeywordsEmbedding());

                double totalSim = 
                        DOMAIN_WEIGHT * domainSim +
                        TECH_WEIGHT * techSim +
                        PROBLEM_WEIGHT * problemSim +
                        SOLUTION_WEIGHT * solutionSim +
                        ARCHITECTURE_WEIGHT * archSim +
                        KEYWORDS_WEIGHT * keywordsSim;

                if (totalSim > bestSimilarity) {
                    bestSimilarity = totalSim;
                    bestDomain = domainSim;
                    bestTech = techSim;
                    bestProblem = problemSim;
                    bestSolution = solutionSim;
                    bestArchitecture = archSim;
                    bestKeywords = keywordsSim;
                    bestPortfolioContent = projEmb.getContent();
                }
            }

            scoredList.add(new ScoredJobPosting(
                    jobEmb,
                    bestSimilarity,
                    bestDomain,
                    bestTech,
                    bestProblem,
                    bestSolution,
                    bestArchitecture,
                    bestKeywords,
                    bestPortfolioContent
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
        String companyContent = jobPostingOpt
                .map(jp -> {
                    if (jp.getCompany() != null && jp.getCompany().getBusiCont() != null) {
                        return jp.getCompany().getBusiCont();
                    }
                    return jp.getDetail();
                })
                .orElse("");
        if (companyContent == null) {
            companyContent = "";
        }
        String portfolioContent = scored.portfolioContent() != null ? scored.portfolioContent() : "";

        // tech JSON 파싱
        List<String> techList = parseJsonArray(emb.getTech());

        return new JobPostingMatchResponse.MatchedJobPosting(
                emb.getJobPostingId(),
                title,
                companyName,
                emb.getDomain(),
                techList,
                emb.getProblem(),
                emb.getSolution(),
                scored.similarity(),
                scored.domainSim(),
                scored.techSim(),
                scored.problemSim(),
                scored.solutionSim(),
                scored.architectureSim(),
                scored.keywordsSim(),
                portfolioContent,
                companyContent
        );
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

    private double cosineSimilarity(String vec1, String vec2) {
        if (vec1 == null || vec2 == null || vec1.isBlank() || vec2.isBlank()) {
            return 0.0;
        }
        try {
            List<Double> v1 = parseVector(vec1);
            List<Double> v2 = parseVector(vec2);
            
            if (v1.size() != v2.size() || v1.isEmpty()) {
                return 0.0;
            }

            double dotProduct = 0.0;
            double norm1 = 0.0;
            double norm2 = 0.0;

            for (int i = 0; i < v1.size(); i++) {
                dotProduct += v1.get(i) * v2.get(i);
                norm1 += v1.get(i) * v1.get(i);
                norm2 += v2.get(i) * v2.get(i);
            }

            double denom = Math.sqrt(norm1) * Math.sqrt(norm2);
            return denom == 0 ? 0.0 : dotProduct / denom;
        } catch (Exception e) {
            return 0.0;
        }
    }

    private List<Double> parseVector(String vectorString) {
        // "[0.1,0.2,0.3]" 형태 파싱
        String cleaned = vectorString.trim();
        if (cleaned.startsWith("[")) {
            cleaned = cleaned.substring(1);
        }
        if (cleaned.endsWith("]")) {
            cleaned = cleaned.substring(0, cleaned.length() - 1);
        }
        
        List<Double> result = new ArrayList<>();
        for (String s : cleaned.split(",")) {
            try {
                result.add(Double.parseDouble(s.trim()));
            } catch (NumberFormatException e) {
                result.add(0.0);
            }
        }
        return result;
    }

    private record ScoredJobPosting(
            JobPostingEmbedding embedding,
            double similarity,
            double domainSim,
            double techSim,
            double problemSim,
            double solutionSim,
            double architectureSim,
            double keywordsSim,
            String portfolioContent
    ) {}
}
