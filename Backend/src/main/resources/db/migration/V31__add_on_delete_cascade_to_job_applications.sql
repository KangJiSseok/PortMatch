ALTER TABLE job_applications
DROP CONSTRAINT IF EXISTS fk_job_applications_job_posting;

ALTER TABLE job_applications
    ADD CONSTRAINT fk_job_applications_job_posting
        FOREIGN KEY (job_posting_id)
            REFERENCES job_postings(id)
            ON DELETE CASCADE;
