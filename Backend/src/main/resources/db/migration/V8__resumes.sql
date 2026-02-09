CREATE TABLE IF NOT EXISTS resumes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    is_main BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id
    ON resumes (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_resumes_user_main
    ON resumes (user_id)
    WHERE is_main = true;

CREATE TABLE IF NOT EXISTS resume_profiles (
    id BIGSERIAL PRIMARY KEY,
    resume_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    profile_image_url VARCHAR(1024),
    profile_image_key VARCHAR(512),
    profile_image_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_resume_profiles_resume_id UNIQUE (resume_id),
    CONSTRAINT fk_resume_profiles_resume
        FOREIGN KEY (resume_id)
        REFERENCES resumes (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resume_profiles_resume_id
    ON resume_profiles (resume_id);

CREATE TABLE IF NOT EXISTS resume_career_entries (
    id BIGSERIAL PRIMARY KEY,
    resume_id BIGINT NOT NULL,
    company VARCHAR(200) NOT NULL,
    role VARCHAR(100) NOT NULL,
    period_start DATE,
    period_end DATE,
    employment_status VARCHAR(20),
    description TEXT,
    order_index INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_resume_career_entries_resume
        FOREIGN KEY (resume_id)
        REFERENCES resumes (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resume_career_entries_resume_id
    ON resume_career_entries (resume_id);

CREATE INDEX IF NOT EXISTS idx_resume_career_entries_order
    ON resume_career_entries (resume_id, order_index);

CREATE TABLE IF NOT EXISTS resume_education_entries (
    id BIGSERIAL PRIMARY KEY,
    resume_id BIGINT NOT NULL,
    school VARCHAR(200) NOT NULL,
    major VARCHAR(200) NOT NULL,
    degree VARCHAR(20),
    period_start DATE,
    period_end DATE,
    status VARCHAR(20),
    order_index INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_resume_education_entries_resume
        FOREIGN KEY (resume_id)
        REFERENCES resumes (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resume_education_entries_resume_id
    ON resume_education_entries (resume_id);

CREATE INDEX IF NOT EXISTS idx_resume_education_entries_order
    ON resume_education_entries (resume_id, order_index);

CREATE TABLE IF NOT EXISTS resume_portfolio_files (
    id BIGSERIAL PRIMARY KEY,
    resume_id BIGINT NOT NULL,
    s3_key VARCHAR(512) NOT NULL,
    file_url VARCHAR(1024) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(255),
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_resume_portfolio_files_resume_id UNIQUE (resume_id),
    CONSTRAINT fk_resume_portfolio_files_resume
        FOREIGN KEY (resume_id)
        REFERENCES resumes (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resume_portfolio_files_resume_id
    ON resume_portfolio_files (resume_id);

CREATE TABLE IF NOT EXISTS resume_self_introductions (
    id BIGSERIAL PRIMARY KEY,
    resume_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    order_index INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_resume_self_introductions_resume
        FOREIGN KEY (resume_id)
        REFERENCES resumes (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resume_self_introductions_resume_id
    ON resume_self_introductions (resume_id);

CREATE INDEX IF NOT EXISTS idx_resume_self_introductions_order
    ON resume_self_introductions (resume_id, order_index);

CREATE TABLE IF NOT EXISTS resume_self_intro_questions (
    id BIGSERIAL PRIMARY KEY,
    self_introduction_id BIGINT NOT NULL,
    question_text TEXT NOT NULL,
    order_index INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_resume_self_intro_questions_intro
        FOREIGN KEY (self_introduction_id)
        REFERENCES resume_self_introductions (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resume_self_intro_questions_intro_id
    ON resume_self_intro_questions (self_introduction_id);

CREATE INDEX IF NOT EXISTS idx_resume_self_intro_questions_order
    ON resume_self_intro_questions (self_introduction_id, order_index);

CREATE TABLE IF NOT EXISTS resume_self_intro_answers (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_resume_self_intro_answers_question_id UNIQUE (question_id),
    CONSTRAINT fk_resume_self_intro_answers_question
        FOREIGN KEY (question_id)
        REFERENCES resume_self_intro_questions (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_resume_self_intro_answers_question_id
    ON resume_self_intro_answers (question_id);
