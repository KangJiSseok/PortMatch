-- job_posting_parsed: LLM 파싱 결과 저장
CREATE TABLE IF NOT EXISTS job_posting_parsed (
    id BIGSERIAL PRIMARY KEY,
    job_posting_id BIGINT NOT NULL UNIQUE,
    name VARCHAR(500),
    domain VARCHAR(100),
    problem TEXT,
    solution TEXT,
    tech TEXT,
    architecture_experience TEXT,
    keywords TEXT,
    content TEXT,
    content_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_job_posting_parsed_job_posting
        FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_posting_parsed_job_posting_id
    ON job_posting_parsed(job_posting_id);

-- job_posting_embeddings: 파싱 결과 + 임베딩 저장
CREATE TABLE IF NOT EXISTS job_posting_embeddings (
    id BIGSERIAL PRIMARY KEY,
    job_posting_id BIGINT NOT NULL,
    name VARCHAR(500),
    domain VARCHAR(100),
    problem TEXT,
    solution TEXT,
    tech TEXT,
    architecture_experience TEXT,
    keywords TEXT,
    content TEXT,
    content_hash VARCHAR(64),
    name_embedding vector(1536),
    domain_embedding vector(1536),
    problem_embedding vector(1536),
    solution_embedding vector(1536),
    tech_embedding vector(1536),
    architecture_embedding vector(1536),
    keywords_embedding vector(1536),
    problem_missing BOOLEAN NOT NULL DEFAULT FALSE,
    solution_missing BOOLEAN NOT NULL DEFAULT FALSE,
    tech_missing BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uk_job_posting_embeddings_job_posting_id UNIQUE (job_posting_id),
    CONSTRAINT fk_job_posting_embeddings_job_posting
        FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_posting_embeddings_job_posting_id
    ON job_posting_embeddings(job_posting_id);
