ALTER TABLE job_applications
    ADD COLUMN IF NOT EXISTS resume_viewed boolean NOT NULL DEFAULT false;

UPDATE job_applications
SET resume_viewed = false
WHERE resume_viewed IS NULL;
