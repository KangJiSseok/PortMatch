-- 1. 제약 조건 먼저 제거
ALTER TABLE company_scraps DROP CONSTRAINT IF EXISTS fk_company_scrap_company;
ALTER TABLE company_scraps DROP CONSTRAINT IF EXISTS fkoq71x46thfk16ob2240jc9gcy;
ALTER TABLE company_scraps DROP CONSTRAINT IF EXISTS fk_company_scrap_user;

-- 2. [중요] 타입을 먼저 문자열로 변경 (그래야 아래에서 cid랑 비교가 가능함)
ALTER TABLE company_scraps
ALTER COLUMN company_cid TYPE varchar(255) USING company_cid::varchar;

-- 3. 이제 타입이 같으니 고아 데이터 삭제 가능
DELETE FROM company_scraps WHERE company_cid NOT IN (SELECT cid FROM companies);
DELETE FROM company_scraps WHERE user_id NOT IN (SELECT id FROM users);

-- 4. 제약 조건 다시 생성
ALTER TABLE company_scraps ADD CONSTRAINT fk_company_scrap_company FOREIGN KEY (company_cid) REFERENCES companies(cid) ON DELETE CASCADE;
ALTER TABLE company_scraps ADD CONSTRAINT fk_company_scrap_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

---------------------------------------------------------
-- 5. 공고 스크랩 (ScrapEntity) 처리
---------------------------------------------------------
ALTER TABLE scraps DROP CONSTRAINT IF EXISTS fk_scrap_user;
ALTER TABLE scraps DROP CONSTRAINT IF EXISTS fk_scrap_posting;
ALTER TABLE scraps DROP CONSTRAINT IF EXISTS fk_scraps_user;
ALTER TABLE scraps DROP CONSTRAINT IF EXISTS fk_scraps_posting;

-- 고아 데이터 삭제 (이미 둘 다 bigint라 비교 잘 됨)
DELETE FROM scraps WHERE pid NOT IN (SELECT id FROM job_postings);
DELETE FROM scraps WHERE uid NOT IN (SELECT id FROM users);

-- 제약 조건 생성
ALTER TABLE scraps ADD CONSTRAINT fk_scrap_user FOREIGN KEY (uid) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE scraps ADD CONSTRAINT fk_scrap_posting FOREIGN KEY (pid) REFERENCES job_postings(id) ON DELETE CASCADE;