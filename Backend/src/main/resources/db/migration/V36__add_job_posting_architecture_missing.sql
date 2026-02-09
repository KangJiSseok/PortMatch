ALTER TABLE IF EXISTS job_posting_embeddings
    ADD COLUMN IF NOT EXISTS architecture_missing BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE job_posting_embeddings
SET architecture_missing = FALSE
WHERE architecture_missing IS NULL;
