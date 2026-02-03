-- Companies 테이블 컬럼 크기 확장
-- companiesName, size, totPsncnt 필드 길이 제한 해제 또는 확장

-- companiesName: 회사명은 특수문자/영문 포함해서 길어질 수 있음
ALTER TABLE companies ALTER COLUMN companies_name TYPE VARCHAR(500);

-- size: 업종/산업 분류
ALTER TABLE companies ALTER COLUMN size TYPE VARCHAR(500);

-- totPsncnt: 직원 수 범위
ALTER TABLE companies ALTER COLUMN tot_psncnt TYPE VARCHAR(100);

-- yrSalesAmt: 매출액 범위 (혹시 모르니)
ALTER TABLE companies ALTER COLUMN yr_sales_amt TYPE VARCHAR(100);

-- job_postings.title: 공고 제목이 길 수 있음
ALTER TABLE job_postings ALTER COLUMN title TYPE VARCHAR(500);
