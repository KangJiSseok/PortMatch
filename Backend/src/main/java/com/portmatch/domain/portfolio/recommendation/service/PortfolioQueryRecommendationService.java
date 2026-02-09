package com.portmatch.domain.portfolio.recommendation.service;

import com.portmatch.domain.portfolio.embedding.client.PortfolioAnalysisClient;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioQueryEmbeddingRequest;
import com.portmatch.domain.portfolio.embedding.dto.PortfolioQueryEmbeddingResponse;
import com.portmatch.domain.portfolio.embedding.repository.PortfolioUserTagRecommendationRepository;
import com.portmatch.domain.portfolio.embedding.repository.UserTagRecommendationRow;
import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.auth.repository.UserRepository;
import com.portmatch.domain.portfolio.entity.Portfolio;
import com.portmatch.domain.portfolio.recommendation.dto.PortfolioQueryRecommendationHistoryResponse;
import com.portmatch.domain.portfolio.recommendation.dto.PortfolioQueryRecommendationResponse;
import com.portmatch.domain.portfolio.recommendation.entity.PortfolioQueryHistory;
import com.portmatch.domain.portfolio.recommendation.entity.PortfolioQueryRecommendationResult;
import com.portmatch.domain.portfolio.recommendation.repository.PortfolioQueryHistoryRepository;
import com.portmatch.domain.portfolio.recommendation.repository.PortfolioQueryRecommendationResultRepository;
import com.portmatch.domain.portfolio.repository.PortfolioRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class PortfolioQueryRecommendationService {

    private final PortfolioAnalysisClient embeddingClient;
    private final PortfolioUserTagRecommendationRepository tagEmbeddingRepository;
    private final UserRepository userRepository;
    private final PortfolioQueryHistoryRepository historyRepository;
    private final PortfolioQueryRecommendationResultRepository resultRepository;
    private final PortfolioRepository portfolioRepository;

    public PortfolioQueryRecommendationService(
            PortfolioAnalysisClient embeddingClient,
            PortfolioUserTagRecommendationRepository tagEmbeddingRepository,
            UserRepository userRepository,
            PortfolioQueryHistoryRepository historyRepository,
            PortfolioQueryRecommendationResultRepository resultRepository,
            PortfolioRepository portfolioRepository
    ) {
        this.embeddingClient = embeddingClient;
        this.tagEmbeddingRepository = tagEmbeddingRepository;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
        this.resultRepository = resultRepository;
        this.portfolioRepository = portfolioRepository;
    }

    public PortfolioQueryRecommendationResponse recommendByQuery(String query, Integer limit) {
        return computeRecommendation(query, limit, null);
    }

    @Transactional
    public PortfolioQueryRecommendationResponse recommendByQueryAndSave(Long userId, String query, Integer limit) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.USER_NOT_FOUND));
        PortfolioQueryRecommendationResponse response = computeRecommendation(query, limit, userId);
        PortfolioQueryHistory history = historyRepository.save(
                PortfolioQueryHistory.create(user, query)
        );

        List<PortfolioQueryRecommendationResult> results = mapResults(history, response.recommendations());
        resultRepository.saveAll(results);
        return response;
    }

    @Transactional(readOnly = true)
    public PortfolioQueryRecommendationHistoryResponse getHistory(Long userId, org.springframework.data.domain.Pageable pageable) {
        List<PortfolioQueryRecommendationHistoryResponse.QueryHistory> histories =
                historyRepository.findAllByUser_IdOrderByCreatedAtDesc(userId, pageable)
                        .getContent()
                        .stream()
                        .map(history -> new PortfolioQueryRecommendationHistoryResponse.QueryHistory(
                                history.getId(),
                                history.getQueryText(),
                                history.getCreatedAt(),
                                mapResultItems(resultRepository.findAllByQueryHistory_IdOrderByIdAsc(history.getId()))
                        ))
                        .toList();
        return new PortfolioQueryRecommendationHistoryResponse(histories);
    }

    private PortfolioQueryRecommendationResponse computeRecommendation(String query, Integer limit, Long excludeUserId) {
        int resolvedLimit = (limit == null || limit <= 0) ? 10 : limit;
        PortfolioQueryEmbeddingResponse embedding = embeddingClient.embedQuery(
                new PortfolioQueryEmbeddingRequest(query, null)
        );

        String techVector = toVectorString(embedding.techEmbedding());
        String keywordVector = toVectorString(embedding.keywordEmbedding());
        String architectureVector = toVectorString(embedding.architectureEmbedding());
        String unifiedVector = toVectorString(embedding.unifiedEmbedding());

        // 새로운 가중치: unified 0.5, architecture 0.3, tech 0.2
        // missing인 경우 가중치를 낮춤
        double techWeight = embedding.techMissing() ? 0.1 : 0.2;
        double architectureWeight = embedding.architectureMissing() ? 0.15 : 0.3;
        double unifiedWeight = 0.5;

        List<UserTagRecommendationRow> rows = tagEmbeddingRepository.findTopUsersByQueryEmbedding(
                techVector,
                keywordVector,
                architectureVector,
                unifiedVector,
                techWeight,
                architectureWeight,
                unifiedWeight,
                excludeUserId,
                resolvedLimit
        );

        List<PortfolioQueryRecommendationResponse.Item> items = rows.stream()
                .map(r -> new PortfolioQueryRecommendationResponse.Item(
                        r.getUserId(),
                        r.getUserName(),
                        r.getPortfolioId(),
                        safe(r.getTechSimilarity()),
                        safe(r.getKeywordSimilarity()),
                        safe(r.getArchitectureSimilarity()),
                        safe(r.getUnifiedSimilarity()),
                        r.getTechText(),
                        r.getKeywordText(),
                        r.getArchitectureText(),
                        r.getUnifiedText(),
                        safe(r.getSimilarity())
                ))
                .toList();

        return new PortfolioQueryRecommendationResponse(
                embedding.tech(),
                embedding.keywords(),
                embedding.architectureExperience(),
                embedding.expandedConcepts(),
                items
        );
    }

    private double safe(Double value) {
        return value == null ? 0.0 : value;
    }

    private String toVectorString(List<Double> vector) {
        if (vector == null || vector.isEmpty()) {
            throw new BusinessException(ResponseCode.EMBEDDING_VECTOR_EMPTY);
        }
        return "[" + vector.stream()
                .map(String::valueOf)
                .reduce((a, b) -> a + "," + b)
                .orElse("") + "]";
    }

    private List<PortfolioQueryRecommendationResult> mapResults(
            PortfolioQueryHistory history,
            List<PortfolioQueryRecommendationResponse.Item> items
    ) {
        if (items == null) {
            return List.of();
        }
        List<Long> portfolioIds = items.stream()
                .map(PortfolioQueryRecommendationResponse.Item::portfolioId)
                .filter(java.util.Objects::nonNull)
                .toList();
        java.util.Map<Long, String> portfolioNameMap = portfolioRepository.findAllById(portfolioIds).stream()
                .collect(java.util.stream.Collectors.toMap(Portfolio::getId, Portfolio::getOriginalFilename));
        return items.stream()
                .map(item -> PortfolioQueryRecommendationResult.create(
                        history,
                        item.userId(),
                        item.userName(),
                        item.portfolioId(),
                        portfolioNameMap.get(item.portfolioId()),
                        item.similarity()
                ))
                .toList();
    }

    private List<PortfolioQueryRecommendationHistoryResponse.RecommendationItem> mapResultItems(
            List<PortfolioQueryRecommendationResult> results
    ) {
        if (results == null) {
            return List.of();
        }
        return results.stream()
                .map(r -> new PortfolioQueryRecommendationHistoryResponse.RecommendationItem(
                        r.getUserId(),
                        r.getUserName(),
                        r.getPortfolioId(),
                        r.getPortfolioName(),
                        safe(r.getSimilarity())
                ))
                .toList();
    }

}

