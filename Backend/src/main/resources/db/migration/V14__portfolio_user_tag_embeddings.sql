DROP TABLE IF EXISTS portfolio_project_tag_embeddings;
DROP TABLE IF EXISTS portfolio_user_tag_embeddings;

CREATE TABLE IF NOT EXISTS portfolio_user_tech_embeddings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    portfolio_id BIGINT NOT NULL,
    tech_text VARCHAR(512) NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uk_portfolio_user_tech_embeddings_portfolio_text UNIQUE (portfolio_id, tech_text)
);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_tech_embeddings_user_id
    ON portfolio_user_tech_embeddings (user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_tech_embeddings_portfolio_id
    ON portfolio_user_tech_embeddings (portfolio_id);

CREATE TABLE IF NOT EXISTS portfolio_user_keyword_embeddings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    portfolio_id BIGINT NOT NULL,
    keyword_text VARCHAR(512) NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uk_portfolio_user_keyword_embeddings_portfolio_text UNIQUE (portfolio_id, keyword_text)
);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_keyword_embeddings_user_id
    ON portfolio_user_keyword_embeddings (user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_keyword_embeddings_portfolio_id
    ON portfolio_user_keyword_embeddings (portfolio_id);

CREATE TABLE IF NOT EXISTS portfolio_user_architecture_embeddings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    portfolio_id BIGINT NOT NULL,
    architecture_text VARCHAR(512) NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uk_portfolio_user_architecture_embeddings_portfolio_text UNIQUE (portfolio_id, architecture_text)
);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_architecture_embeddings_user_id
    ON portfolio_user_architecture_embeddings (user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_architecture_embeddings_portfolio_id
    ON portfolio_user_architecture_embeddings (portfolio_id);
