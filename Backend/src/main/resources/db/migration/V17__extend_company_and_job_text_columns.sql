-- Extend long text columns to avoid truncation on crawler import
-- Generated on 2026-02-02

ALTER TABLE companies
    ALTER COLUMN busi_cont TYPE TEXT;

ALTER TABLE job_postings
    ALTER COLUMN detail TYPE TEXT;
