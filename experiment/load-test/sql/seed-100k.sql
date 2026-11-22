\set ON_ERROR_STOP on
BEGIN;

INSERT INTO tech_stacks (id, stack_name) VALUES
  (1, 'Java'), (2, 'Spring Boot'), (3, 'PostgreSQL'), (4, 'React'),
  (5, 'TypeScript'), (6, 'Python'), (7, 'Docker'), (8, 'AWS'),
  (9, 'Redis'), (10, 'Kotlin'), (11, 'Go'), (12, 'Kubernetes');

INSERT INTO companies (cid, companies_name, address, size, busi_cont)
SELECT 'FLOW-' || lpad(id::text, 5, '0'),
       '포트매치 테스트 기업 ' || lpad(id::text, 5, '0'),
       (ARRAY['서울', '성남', '대전', '부산'])[1 + id % 4],
       (ARRAY['스타트업', '중소기업', '중견기업', '대기업'])[1 + id % 4],
       '부하 테스트용 가상 기업'
FROM generate_series(1, 10000) AS series(id);

INSERT INTO job_postings (id, active, detail, end_date, job_type, start_date, title, vcnt, cid)
SELECT id, 1, repeat('가상 공고입니다. 서비스 개발 및 운영, 테스트 자동화, 성능 분석 업무를 수행합니다. ', 12),
       '2099-12-31', 1 + id % 3, to_char(date '2025-01-01' + (id % 600), 'YYYY-MM-DD'),
       (ARRAY['백엔드 개발자', '프론트엔드 개발자', '데이터 엔지니어', '인프라 엔지니어', '플랫폼 개발자'])[1 + id % 5]
         || ' · 팀 ' || lpad((id % 2000)::text, 4, '0') || ' · ' || id,
       0, 'FLOW-' || lpad((1 + (id - 1) / 10)::text, 5, '0')
FROM generate_series(1, 100000) AS series(id);

INSERT INTO posting_stacks (job_posting_id, stack_id)
SELECT j.id, 1 + (j.id + offset_id) % 12
FROM job_postings j CROSS JOIN generate_series(0, 2) AS offsets(offset_id)
WHERE j.id % 10 <> 0;

INSERT INTO users (id, created_at, email, name, password, phone, role, username)
SELECT id, timestamp '2026-01-01 00:00:00', 'fixture-' || id || '@example.invalid',
       '테스트 지원자 ' || id, '!fixture-login-disabled', '0100000' || lpad(id::text, 4, '0'),
       'APPLICANT', 'flow-fixture-' || id
FROM generate_series(1, 2000) AS series(id);

INSERT INTO applicants (user_id, total_experience_years)
SELECT id, id % 10 FROM users;

INSERT INTO scraps (created_at, updated_at, pid, user_id)
SELECT timestamp '2026-01-01 00:00:00', timestamp '2026-01-01 00:00:00',
       1 + ((u.id * 47 + slot * 7919) % 100000), u.id
FROM users u CROSS JOIN generate_series(1, 5) AS slots(slot);

SELECT setval(pg_get_serial_sequence('job_postings', 'id'), (SELECT max(id) FROM job_postings));
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT max(id) FROM users));
COMMIT;
ANALYZE;
