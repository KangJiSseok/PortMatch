-- Replace project-level job posting embeddings with user-level portfolio embeddings
-- Generated on 2026-02-03

DROP TABLE IF EXISTS portfolio_project_job_posting_embeddings;

CREATE TABLE IF NOT EXISTS portfolio_user_job_posting_embeddings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    portfolio_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    name_embedding vector(1536),
    domain_embedding vector(1536),
    problem_embedding vector(1536),
    tech_embedding vector(1536),
    architecture_embedding vector(1536),
    problem_missing BOOLEAN NOT NULL DEFAULT FALSE,
    tech_missing BOOLEAN NOT NULL DEFAULT FALSE,
    architecture_missing BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_portfolio_user_job_posting_embeddings_portfolio UNIQUE (portfolio_id)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_job_posting_embeddings_user_id
    ON portfolio_user_job_posting_embeddings (user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_job_posting_embeddings_portfolio_id
    ON portfolio_user_job_posting_embeddings (portfolio_id);
