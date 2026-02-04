package com.portmatch.domain.portfolio.recommendation.entity;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(
        name = "portfolio_query_histories",
        indexes = {
                @Index(name = "idx_portfolio_query_histories_user_id", columnList = "user_id")
        }
)
public class PortfolioQueryHistory extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_portfolio_query_histories_user")
    )
    private User user;

    @Column(name = "query_text", columnDefinition = "TEXT", nullable = false)
    private String queryText;

    public static PortfolioQueryHistory create(
            User user,
            String queryText
    ) {
        PortfolioQueryHistory history = new PortfolioQueryHistory();
        history.user = user;
        history.queryText = queryText;
        return history;
    }
}
