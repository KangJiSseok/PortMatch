DO $$
BEGIN
    -- Flyway runs before Hibernate creates the table on an empty database.
    IF to_regclass('public.posting_stacks') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_posting_stacks_job_posting_id
            ON public.posting_stacks (job_posting_id);
    END IF;
END;
$$;
