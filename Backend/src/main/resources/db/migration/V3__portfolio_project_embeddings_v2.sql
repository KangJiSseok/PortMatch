CREATE TABLE IF NOT EXISTS portfolio_project_embeddings_v2 (
    id BIGSERIAL PRIMARY KEY,
    portfolio_id BIGINT NOT NULL,
    analysis_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uk_portfolio_project_embeddings_v2_project_id UNIQUE (project_id)
);
