ALTER TABLE IF EXISTS portfolio_query_histories
  DROP COLUMN IF EXISTS tech_json,
  DROP COLUMN IF EXISTS keywords_json,
  DROP COLUMN IF EXISTS architecture_experience_json,
  DROP COLUMN IF EXISTS expanded_concepts_json;
