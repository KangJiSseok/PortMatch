CREATE TABLE IF NOT EXISTS portfolio_query_histories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  query_text TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  CONSTRAINT fk_portfolio_query_histories_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_query_histories_user_id
  ON portfolio_query_histories(user_id);

CREATE TABLE IF NOT EXISTS portfolio_query_recommendation_results (
  id BIGSERIAL PRIMARY KEY,
  query_id BIGINT NOT NULL,
  user_id BIGINT,
  user_name VARCHAR(100),
  portfolio_id BIGINT,
  portfolio_name VARCHAR(255),
  similarity DOUBLE PRECISION,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  CONSTRAINT fk_portfolio_query_results_query
    FOREIGN KEY (query_id) REFERENCES portfolio_query_histories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_query_results_query_id
  ON portfolio_query_recommendation_results(query_id);
