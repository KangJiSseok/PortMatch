ALTER TABLE portfolios
    ADD COLUMN IF NOT EXISTS is_main BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE portfolios p
SET is_main = TRUE
FROM resumes r
WHERE r.portfolio_id = p.id
  AND r.is_main = TRUE;
