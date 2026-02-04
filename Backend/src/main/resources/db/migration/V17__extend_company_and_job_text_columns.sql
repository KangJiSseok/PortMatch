-- Extend long text columns to avoid truncation on crawler import
-- Generated on 2026-02-02

ALTER TABLE IF EXISTS companies
    ALTER COLUMN busi_cont TYPE TEXT;

ALTER TABLE IF EXISTS job_postings
    ALTER COLUMN detail TYPE TEXT;
