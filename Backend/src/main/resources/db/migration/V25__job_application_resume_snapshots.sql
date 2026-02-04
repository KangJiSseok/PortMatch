ALTER TABLE IF EXISTS job_applications
  ALTER COLUMN resume_id DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_job_applications_resume'
  ) THEN
    ALTER TABLE job_applications
      DROP CONSTRAINT fk_job_applications_resume;
  END IF;
END$$;

ALTER TABLE IF EXISTS job_applications
  ADD CONSTRAINT fk_job_applications_resume
  FOREIGN KEY (resume_id) REFERENCES resumes(id)
  ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS job_application_resume_snapshots (
  job_application_id BIGINT PRIMARY KEY,
  resume_id BIGINT,
  payload_json TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  CONSTRAINT fk_job_application_resume_snapshots_application
    FOREIGN KEY (job_application_id) REFERENCES job_applications(id) ON DELETE CASCADE
);
