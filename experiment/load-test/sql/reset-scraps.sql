\set ON_ERROR_STOP on
BEGIN;
DELETE FROM scraps
WHERE user_id IN (
  SELECT id FROM users
  WHERE email ~ '^flow-k6-([1-9]|1[0-9]|2[0-4])@example[.]com$'
);
INSERT INTO scraps (user_id, pid, created_at, updated_at)
SELECT u.id, j.id, timestamp '2026-01-01', timestamp '2026-01-01'
FROM users u
CROSS JOIN (SELECT id FROM job_postings ORDER BY id LIMIT 5) j
WHERE u.email ~ '^flow-k6-([1-9]|1[0-9]|2[0-4])@example[.]com$';
COMMIT;
