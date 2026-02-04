BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'job_applications'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE job_applications
      ADD COLUMN user_id BIGINT;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'job_applications'
      AND column_name = 'applicant_id'
  ) THEN
    UPDATE job_applications ja
    SET user_id = a.user_id
    FROM applicants a
    WHERE ja.applicant_id = a.id
      AND ja.user_id IS NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM job_applications
    WHERE user_id IS NULL
  ) THEN
    ALTER TABLE job_applications
      ALTER COLUMN user_id SET NOT NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
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
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uk_job_applications_user_job_posting'
  ) THEN
    ALTER TABLE job_applications
      ADD CONSTRAINT uk_job_applications_user_job_posting
      UNIQUE (user_id, job_posting_id);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_job_applications_user_id
  ON job_applications(user_id);

ALTER TABLE job_applications
  DROP COLUMN IF EXISTS applicant_id;

COMMIT;
