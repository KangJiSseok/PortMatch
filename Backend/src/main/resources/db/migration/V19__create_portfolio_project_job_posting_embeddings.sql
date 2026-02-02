-- Create table for portfolio project embeddings used in job-posting matching
-- Generated on 2026-02-02

CREATE TABLE IF NOT EXISTS portfolio_project_job_posting_embeddings (
    id BIGSERIAL PRIMARY KEY,
    portfolio_id BIGINT NOT NULL,
    analysis_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    project_embedding vector(1536),
    domain_embedding vector(1536),
    problem_embedding vector(1536),
    solution_embedding vector(1536),
    tech_embedding vector(1536),
    architecture_embedding vector(1536),
    keywords_embedding vector(1536),
    problem_missing BOOLEAN NOT NULL DEFAULT FALSE,
    solution_missing BOOLEAN NOT NULL DEFAULT FALSE,
    tech_missing BOOLEAN NOT NULL DEFAULT FALSE,
    architecture_missing BOOLEAN NOT NULL DEFAULT FALSE,
    keywords_missing BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_portfolio_project_job_posting_embeddings_project_id UNIQUE (project_id)
);
