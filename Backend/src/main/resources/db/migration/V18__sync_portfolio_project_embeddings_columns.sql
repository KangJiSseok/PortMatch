-- Align portfolio_project_embeddings table with JPA entity fields
-- Generated on 2026-02-02

ALTER TABLE portfolio_project_embeddings
    ADD COLUMN IF NOT EXISTS portfolio_id BIGINT,
    ADD COLUMN IF NOT EXISTS analysis_id BIGINT,
    ADD COLUMN IF NOT EXISTS project_id BIGINT,
    ADD COLUMN IF NOT EXISTS content TEXT,
    ADD COLUMN IF NOT EXISTS content_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS project_embedding vector(1536),
    ADD COLUMN IF NOT EXISTS domain_embedding vector(1536),
    ADD COLUMN IF NOT EXISTS problem_embedding vector(1536),
    ADD COLUMN IF NOT EXISTS solution_embedding vector(1536),
    ADD COLUMN IF NOT EXISTS tech_embedding vector(1536),
    ADD COLUMN IF NOT EXISTS architecture_embedding vector(1536),
    ADD COLUMN IF NOT EXISTS keywords_embedding vector(1536),
    ADD COLUMN IF NOT EXISTS problem_missing BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS solution_missing BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tech_missing BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS architecture_missing BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS keywords_missing BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP;
