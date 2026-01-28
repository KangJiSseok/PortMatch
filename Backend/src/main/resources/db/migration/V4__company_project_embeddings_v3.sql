CREATE TABLE IF NOT EXISTS company_project_embeddings_v3 (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL,
    analysis_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    project_name TEXT NOT NULL,
    problem TEXT NOT NULL,
    solution TEXT NOT NULL,
    techs TEXT NOT NULL,
    content TEXT NOT NULL,
    name_embedding vector(1536) NOT NULL,
    problem_embedding vector(1536) NOT NULL,
    solution_embedding vector(1536) NOT NULL,
    tech_embedding vector(1536) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_company_project_embeddings_v3_project_id UNIQUE (project_id)
);
