CREATE TABLE IF NOT EXISTS portfolio_project_tag_embeddings (
    id BIGSERIAL PRIMARY KEY,
    portfolio_id BIGINT NOT NULL,
    analysis_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    tech_embedding vector(1536) NOT NULL,
    keyword_embedding vector(1536) NOT NULL,
    architecture_embedding vector(1536) NOT NULL,
    tech_missing BOOLEAN NOT NULL,
    keyword_missing BOOLEAN NOT NULL,
    architecture_missing BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uk_portfolio_project_tag_embeddings_project_id UNIQUE (project_id)
);
