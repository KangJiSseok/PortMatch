ALTER TABLE interview_schedule
DROP CONSTRAINT IF EXISTS fkokkesep9u5443vls1n1i112by;


ALTER TABLE interview_schedule
    ADD CONSTRAINT fk_interview_schedule_job_posting
        FOREIGN KEY (job_posting_id) REFERENCES job_postings(id)
            ON DELETE CASCADE;