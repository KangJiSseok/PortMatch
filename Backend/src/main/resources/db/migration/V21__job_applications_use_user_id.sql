BEGIN;

ALTER TABLE job_applications
  DROP CONSTRAINT IF EXISTS fk_job_applications_applicant;

ALTER TABLE job_applications
  DROP CONSTRAINT IF EXISTS uk_job_applications_applicant_job_posting;

DROP INDEX IF EXISTS idx_job_applications_applicant_id;

ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS user_id BIGINT;

UPDATE job_applications ja
SET user_id = a.user_id
FROM applicants a
WHERE ja.applicant_id = a.id;

ALTER TABLE job_applications
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE job_applications
  ADD CONSTRAINT fk_job_applications_user
  FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE job_applications
  ADD CONSTRAINT uk_job_applications_user_job_posting
  UNIQUE (user_id, job_posting_id);

CREATE INDEX idx_job_applications_user_id
  ON job_applications(user_id);

ALTER TABLE job_applications
  DROP COLUMN applicant_id;

COMMIT;
