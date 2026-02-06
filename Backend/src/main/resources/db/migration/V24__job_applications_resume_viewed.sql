ALTER TABLE IF EXISTS job_applications
    ADD COLUMN IF NOT EXISTS resume_viewed boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF to_regclass('public.job_applications') IS NOT NULL THEN
    EXECUTE 'UPDATE job_applications SET resume_viewed = false WHERE resume_viewed IS NULL';
  END IF;
END$$;
