BEGIN;
INSERT INTO companies (cid, companies_name)
VALUES ('baseline-company', 'PortMatch Baseline Company');

INSERT INTO job_postings (id, active, detail, end_date, job_type, start_date, title, vcnt, cid)
SELECT id, 1, repeat('Synthetic job description. ', 20), '2099-12-31',
       1, '2026-01-01',
       'Baseline team ' || lpad((id % 100)::text, 3, '0') || ' opening ' || id,
       0, 'baseline-company'
FROM generate_series(1, 5000) AS jobs(id);

SELECT setval(pg_get_serial_sequence('job_postings', 'id'), 5000);
COMMIT;
ANALYZE;
