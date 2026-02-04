ALTER TABLE IF EXISTS portfolio_query_recommendation_results
  ADD COLUMN IF NOT EXISTS portfolio_name VARCHAR(255);
