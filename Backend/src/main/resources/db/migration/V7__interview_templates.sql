CREATE TABLE IF NOT EXISTS interview_templates (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    target_role VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interview_templates_user_id
    ON interview_templates (user_id);

CREATE TABLE IF NOT EXISTS interview_template_topics (
    id BIGSERIAL PRIMARY KEY,
    template_id BIGINT NOT NULL,
    name VARCHAR(200) NOT NULL,
    order_index INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_interview_template_topics_template
        FOREIGN KEY (template_id)
        REFERENCES interview_templates (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_interview_template_topics_template_id
    ON interview_template_topics (template_id);

CREATE INDEX IF NOT EXISTS idx_interview_template_topics_order
    ON interview_template_topics (template_id, order_index);

CREATE TABLE IF NOT EXISTS interview_template_questions (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    order_index INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_interview_template_questions_topic
        FOREIGN KEY (topic_id)
        REFERENCES interview_template_topics (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_interview_template_questions_topic_id
    ON interview_template_questions (topic_id);

CREATE INDEX IF NOT EXISTS idx_interview_template_questions_order
    ON interview_template_questions (topic_id, order_index);
