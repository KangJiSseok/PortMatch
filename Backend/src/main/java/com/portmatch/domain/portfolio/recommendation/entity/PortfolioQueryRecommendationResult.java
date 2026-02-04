package com.portmatch.domain.portfolio.recommendation.entity;

import com.portmatch.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(
        name = "portfolio_query_recommendation_results",
        indexes = {
                @Index(name = "idx_portfolio_query_results_query_id", columnList = "query_id")
        }
)
public class PortfolioQueryRecommendationResult extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "query_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_portfolio_query_results_query")
    )
    private PortfolioQueryHistory queryHistory;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_name", length = 100)
    private String userName;

    @Column(name = "portfolio_id")
    private Long portfolioId;

    @Column(name = "portfolio_name", length = 255)
    private String portfolioName;

    @Column(name = "similarity")
    private Double similarity;

    public static PortfolioQueryRecommendationResult create(
            PortfolioQueryHistory history,
            Long userId,
            String userName,
            Long portfolioId,
            String portfolioName,
            Double similarity
    ) {
        PortfolioQueryRecommendationResult result = new PortfolioQueryRecommendationResult();
        result.queryHistory = history;
        result.userId = userId;
        result.userName = userName;
        result.portfolioId = portfolioId;
        result.portfolioName = portfolioName;
        result.similarity = similarity;
        return result;
    }
}
