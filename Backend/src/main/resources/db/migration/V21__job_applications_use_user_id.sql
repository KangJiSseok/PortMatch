DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'job_applications'
  ) THEN
    RAISE NOTICE 'job_applications does not exist, skipping V21';
    RETURN;
  END IF;
END$$;

ALTER TABLE IF EXISTS job_applications
  DROP CONSTRAINT IF EXISTS fk_job_applications_applicant;

ALTER TABLE IF EXISTS job_applications
  DROP CONSTRAINT IF EXISTS uk_job_applications_applicant_job_posting;

DROP INDEX IF EXISTS idx_job_applications_applicant_id;

ALTER TABLE IF EXISTS job_applications
  ADD COLUMN IF NOT EXISTS user_id BIGINT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'job_applications'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'applicants'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_applications'
      AND column_name = 'applicant_id'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'applicants'
      AND column_name = 'user_id'
  ) THEN
    EXECUTE 'UPDATE job_applications ja SET user_id = a.user_id FROM applicants a WHERE ja.applicant_id = a.id';
  END IF;
END$$;

DO $$
DECLARE
  has_null_user_id boolean;
BEGIN
  IF to_regclass('public.job_applications') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM job_applications WHERE user_id IS NULL)'
      INTO has_null_user_id;
    IF NOT has_null_user_id THEN
      EXECUTE 'ALTER TABLE job_applications ALTER COLUMN user_id SET NOT NULL';
    END IF;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'job_applications'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_job_applications_user'
  ) THEN
    ALTER TABLE job_applications
      ADD CONSTRAINT fk_job_applications_user
      FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'job_applications'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_job_applications_user_job_posting'
  ) THEN
    ALTER TABLE job_applications
      ADD CONSTRAINT uk_job_applications_user_job_posting
      UNIQUE (user_id, job_posting_id);
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'job_applications'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id)';
  END IF;
END$$;

ALTER TABLE IF EXISTS job_applications
  DROP COLUMN IF EXISTS applicant_id;
