ALTER TABLE IF EXISTS portfolio_query_histories
  DROP COLUMN IF EXISTS limit_count;

ALTER TABLE IF EXISTS portfolio_query_recommendation_results
  DROP COLUMN IF EXISTS tech_similarity,
  DROP COLUMN IF EXISTS keyword_similarity,
  DROP COLUMN IF EXISTS architecture_similarity,
  DROP COLUMN IF EXISTS unified_similarity,
  DROP COLUMN IF EXISTS tech_text,
  DROP COLUMN IF EXISTS keyword_text,
  DROP COLUMN IF EXISTS architecture_text,
  DROP COLUMN IF EXISTS unified_text,
  DROP COLUMN IF EXISTS rank_order;
