-- 1. 기존의 빡빡한 제약 조건을 지운다.
ALTER TABLE job_application_resume_snapshots
DROP CONSTRAINT fk_job_application_resume_snapshots_application;

-- 2. ON DELETE CASCADE를 붙여서 다시 만든다.
-- 이렇게 하면 '지원 기록'이 지워질 때 '스냅샷'도 같이 지워져!
ALTER TABLE job_application_resume_snapshots
    ADD CONSTRAINT fk_job_application_resume_snapshots_application
        FOREIGN KEY (job_application_id) REFERENCES job_applications(id)
            ON DELETE CASCADE;
