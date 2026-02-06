-- Add FK constraints if tables already exist without them
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'job_posting_parsed'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_job_posting_parsed_job_posting'
    ) THEN
        ALTER TABLE job_posting_parsed
            ADD CONSTRAINT fk_job_posting_parsed_job_posting
            FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'job_posting_embeddings'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_job_posting_embeddings_job_posting'
    ) THEN
        ALTER TABLE job_posting_embeddings
            ADD CONSTRAINT fk_job_posting_embeddings_job_posting
            FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE CASCADE;
    END IF;
END $$;
