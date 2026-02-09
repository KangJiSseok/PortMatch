-- 통합 임베딩 테이블 생성
CREATE TABLE IF NOT EXISTS portfolio_user_unified_embeddings
(
    id
    BIGSERIAL
    PRIMARY
    KEY,
    user_id
    BIGINT
    NOT
    NULL,
    portfolio_id
    BIGINT
    NOT
    NULL,
    unified_text
    VARCHAR
(
    4000
) NOT NULL,
    embedding vector
(
    1536
),
    created_at TIMESTAMP NOT NULL DEFAULT NOW
(
),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW
(
),
    CONSTRAINT uk_portfolio_user_unified_embeddings_portfolio UNIQUE
(
    portfolio_id
)
    );
CREATE INDEX IF NOT EXISTS idx_portfolio_user_unified_embeddings_user_id
    ON portfolio_user_unified_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_unified_embeddings_portfolio_id
    ON portfolio_user_unified_embeddings(portfolio_id);