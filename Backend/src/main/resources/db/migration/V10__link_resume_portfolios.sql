ALTER TABLE resumes
    ADD COLUMN IF NOT EXISTS portfolio_id BIGINT;

CREATE TABLE IF NOT EXISTS portfolios (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    s3_key VARCHAR(512) NOT NULL,
    file_url VARCHAR(1024) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(255),
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id
    ON portfolios (user_id);

DO $$
BEGIN
    IF to_regclass('public.users') IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_portfolios_user'
    ) THEN
        ALTER TABLE portfolios
            ADD CONSTRAINT fk_portfolios_user
            FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_resumes_portfolio'
    ) THEN
        ALTER TABLE resumes
            ADD CONSTRAINT fk_resumes_portfolio
            FOREIGN KEY (portfolio_id)
            REFERENCES portfolios (id)
            ON DELETE SET NULL;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uk_resumes_portfolio_id
    ON resumes (portfolio_id)
    WHERE portfolio_id IS NOT NULL;

WITH inserted AS (
    INSERT INTO portfolios (
        user_id,
        s3_key,
        file_url,
        original_filename,
        content_type,
        file_size,
        created_at
    )
    SELECT
        r.user_id,
        f.s3_key,
        f.file_url,
        f.original_filename,
        f.content_type,
        f.file_size,
        f.created_at
    FROM resume_portfolio_files f
    JOIN resumes r ON r.id = f.resume_id
    RETURNING id, user_id, s3_key, file_url, original_filename, content_type, file_size, created_at
),
mapping AS (
    SELECT r.id AS resume_id, p.id AS portfolio_id
    FROM resume_portfolio_files f
    JOIN resumes r ON r.id = f.resume_id
    JOIN inserted p ON p.user_id = r.user_id
        AND p.s3_key = f.s3_key
        AND p.file_url = f.file_url
        AND p.original_filename = f.original_filename
        AND COALESCE(p.content_type, '') = COALESCE(f.content_type, '')
        AND p.file_size = f.file_size
        AND p.created_at = f.created_at
)
UPDATE resumes r
SET portfolio_id = m.portfolio_id
FROM mapping m
WHERE r.id = m.resume_id;

DROP TABLE IF EXISTS resume_portfolio_files;
