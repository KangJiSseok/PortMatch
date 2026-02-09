---------------------------------------------------------
-- 2. 공고 스크랩 (ScrapEntity) 수정
---------------------------------------------------------

-- A. 기존 컬럼명을 엔티티 수정 사항에 맞춰 변경 (uid -> user_id, pid -> job_posting_id)
ALTER TABLE scraps RENAME COLUMN uid TO user_id;
ALTER TABLE scraps RENAME COLUMN pid TO job_posting_id;

-- B. 기존 제약 조건 삭제 (혹시 모르니 다 지우기)
ALTER TABLE scraps DROP CONSTRAINT IF EXISTS fk_scrap_user;
ALTER TABLE scraps DROP CONSTRAINT IF EXISTS fk_scrap_posting;
-- 혹시 유니크 제약조건 이름이 'scraps_uid_pid_key' 등으로 되어 있다면 이것도 지워야 해
ALTER TABLE scraps DROP CONSTRAINT IF EXISTS scraps_uid_pid_key;

-- C. 새로운 이름과 CASCADE 설정으로 다시 추가
ALTER TABLE scraps
    ADD CONSTRAINT fk_scrap_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE scraps
    ADD CONSTRAINT fk_scrap_job_posting
        FOREIGN KEY (job_posting_id) REFERENCES job_postings(id) ON DELETE CASCADE;

-- D. 유니크 제약 조건도 새 컬럼명으로 다시 설정
ALTER TABLE scraps
    ADD CONSTRAINT uq_scrap_user_posting UNIQUE (user_id, job_posting_id);