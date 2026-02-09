CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS flyway_schema_history (
    installed_rank INTEGER NOT NULL PRIMARY KEY,
    version VARCHAR(50),
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    script VARCHAR(1000) NOT NULL,
    checksum INTEGER,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP DEFAULT NOW() NOT NULL,
    execution_time INTEGER NOT NULL,
    success BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS flyway_schema_history_s_idx
    ON flyway_schema_history (success);

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
    template_id BIGINT NOT NULL
        CONSTRAINT fk_interview_template_topics_template
            REFERENCES interview_templates
            ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interview_template_topics_template_id
    ON interview_template_topics (template_id);

CREATE INDEX IF NOT EXISTS idx_interview_template_topics_order
    ON interview_template_topics (template_id, order_index);

CREATE TABLE IF NOT EXISTS interview_template_questions (
    id BIGSERIAL PRIMARY KEY,
    topic_id BIGINT NOT NULL
        CONSTRAINT fk_interview_template_questions_topic
            REFERENCES interview_template_topics
            ON DELETE CASCADE,
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    memo_content TEXT
);

CREATE INDEX IF NOT EXISTS idx_interview_template_questions_topic_id
    ON interview_template_questions (topic_id);

CREATE INDEX IF NOT EXISTS idx_interview_template_questions_order
    ON interview_template_questions (topic_id, order_index);

CREATE TABLE IF NOT EXISTS portfolio_user_tech_embeddings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    portfolio_id BIGINT NOT NULL,
    tech_text VARCHAR(512) NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT uk_portfolio_user_tech_embeddings_portfolio_text
        UNIQUE (portfolio_id, tech_text)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_tech_embeddings_user_id
    ON portfolio_user_tech_embeddings (user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_tech_embeddings_portfolio_id
    ON portfolio_user_tech_embeddings (portfolio_id);

CREATE TABLE IF NOT EXISTS portfolio_user_keyword_embeddings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    portfolio_id BIGINT NOT NULL,
    keyword_text VARCHAR(512) NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT uk_portfolio_user_keyword_embeddings_portfolio_text
        UNIQUE (portfolio_id, keyword_text)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_keyword_embeddings_user_id
    ON portfolio_user_keyword_embeddings (user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_keyword_embeddings_portfolio_id
    ON portfolio_user_keyword_embeddings (portfolio_id);

CREATE TABLE IF NOT EXISTS portfolio_user_architecture_embeddings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    portfolio_id BIGINT NOT NULL,
    architecture_text VARCHAR(512) NOT NULL,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    CONSTRAINT uk_portfolio_user_architecture_embeddings_portfolio_text
        UNIQUE (portfolio_id, architecture_text)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_architecture_embeddings_user_id
    ON portfolio_user_architecture_embeddings (user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_architecture_embeddings_portfolio_id
    ON portfolio_user_architecture_embeddings (portfolio_id);

CREATE TABLE IF NOT EXISTS portfolio_user_unified_embeddings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    portfolio_id BIGINT NOT NULL
        CONSTRAINT uk_portfolio_user_unified_embeddings_portfolio
            UNIQUE,
    unified_text VARCHAR(4000) NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_unified_embeddings_user_id
    ON portfolio_user_unified_embeddings (user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_unified_embeddings_portfolio_id
    ON portfolio_user_unified_embeddings (portfolio_id);

CREATE TABLE IF NOT EXISTS portfolio_user_job_posting_embeddings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    portfolio_id BIGINT NOT NULL
        CONSTRAINT uk_portfolio_user_job_posting_embeddings_portfolio
            UNIQUE,
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    name_embedding vector(1536),
    domain_embedding vector(1536),
    problem_embedding vector(1536),
    tech_embedding vector(1536),
    architecture_embedding vector(1536),
    problem_missing BOOLEAN DEFAULT FALSE NOT NULL,
    tech_missing BOOLEAN DEFAULT FALSE NOT NULL,
    architecture_missing BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_job_posting_embeddings_user_id
    ON portfolio_user_job_posting_embeddings (user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_user_job_posting_embeddings_portfolio_id
    ON portfolio_user_job_posting_embeddings (portfolio_id);

CREATE TABLE IF NOT EXISTS company_project_embeddings (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    analysis_id BIGINT NOT NULL,
    company_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    domain_embedding vector(1536),
    problem_embedding vector(1536),
    problem_missing BOOLEAN NOT NULL,
    project_embedding vector(1536),
    project_id BIGINT NOT NULL
        CONSTRAINT uk_company_project_embeddings_project_id
            UNIQUE,
    solution_embedding vector(1536),
    solution_missing BOOLEAN NOT NULL,
    tech_embedding vector(1536),
    tech_missing BOOLEAN NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE TABLE IF NOT EXISTS interview_session_entity (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP(6),
    session_id VARCHAR(255) NOT NULL
        CONSTRAINT uk9p38pef2wsdurg2bh4gcky253
            UNIQUE,
    status VARCHAR(255)
        CONSTRAINT interview_session_entity_status_check
            CHECK ((status)::text = ANY ((ARRAY['OPEN'::character varying, 'FINISHED'::character varying])::text[])),
    title VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS job_posting_embeddings (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    architecture_embedding vector(1536),
    architecture_experience TEXT,
    content TEXT,
    content_hash VARCHAR(64),
    created_at TIMESTAMP(6) NOT NULL,
    domain VARCHAR(100),
    domain_embedding vector(1536),
    job_posting_id BIGINT NOT NULL
        CONSTRAINT uk_job_posting_embeddings_job_posting_id
            UNIQUE,
    keywords TEXT,
    keywords_embedding vector(1536),
    name VARCHAR(500),
    name_embedding vector(1536),
    problem TEXT,
    problem_embedding vector(1536),
    problem_missing BOOLEAN NOT NULL,
    solution TEXT,
    solution_embedding vector(1536),
    solution_missing BOOLEAN NOT NULL,
    tech TEXT,
    tech_embedding vector(1536),
    tech_missing BOOLEAN NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    architecture_missing BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_job_posting_embeddings_job_posting_id
    ON job_posting_embeddings (job_posting_id);

CREATE TABLE IF NOT EXISTS portfolio_project_embeddings (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    analysis_id BIGINT NOT NULL,
    architecture_embedding vector(1536),
    architecture_missing BOOLEAN NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    domain_embedding vector(1536),
    keywords_missing BOOLEAN NOT NULL,
    portfolio_id BIGINT NOT NULL,
    problem_embedding vector(1536),
    problem_missing BOOLEAN NOT NULL,
    project_embedding vector(1536),
    project_id BIGINT NOT NULL
        CONSTRAINT uk_portfolio_project_embeddings_project_id
            UNIQUE,
    solution_embedding vector(1536),
    solution_missing BOOLEAN NOT NULL,
    tech_embedding vector(1536),
    tech_missing BOOLEAN NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL
);

CREATE TABLE IF NOT EXISTS tech_stacks (
    id BIGINT NOT NULL PRIMARY KEY,
    stack_name VARCHAR(255) NOT NULL
        CONSTRAINT ukgbit8fqyir1m7aslugsbmaux
            UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL,
    email VARCHAR(100) NOT NULL
        CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7
            UNIQUE,
    name VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(30) NOT NULL
        CONSTRAINT users_role_check
            CHECK ((role)::text = ANY ((ARRAY['APPLICANT'::character varying, 'COMPANY'::character varying, 'ADMIN'::character varying])::text[])),
    username VARCHAR(50) NOT NULL
        CONSTRAINT ukr43af9ap4edm43mmtq01oddj6
            UNIQUE
);

CREATE TABLE IF NOT EXISTS portfolios (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL
        CONSTRAINT fk_portfolios_user
            REFERENCES users,
    s3_key VARCHAR(512) NOT NULL,
    file_url VARCHAR(1024) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(255),
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    is_main BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id
    ON portfolios (user_id);

CREATE TABLE IF NOT EXISTS resumes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL
        CONSTRAINT fk_resumes_user
            REFERENCES users,
    title VARCHAR(200) NOT NULL,
    is_main BOOLEAN NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    portfolio_id BIGINT
        CONSTRAINT fk_resumes_portfolio
            REFERENCES portfolios
            ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id
    ON resumes (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_resumes_user_main
    ON resumes (user_id)
    WHERE (is_main = TRUE);

CREATE UNIQUE INDEX IF NOT EXISTS uk_resumes_portfolio_id
    ON resumes (portfolio_id)
    WHERE (portfolio_id IS NOT NULL);

CREATE TABLE IF NOT EXISTS resume_career_entries (
    id BIGSERIAL PRIMARY KEY,
    resume_id BIGINT NOT NULL
        CONSTRAINT fk_resume_career_entries_resume
            REFERENCES resumes
            ON DELETE CASCADE,
    company VARCHAR(200) NOT NULL,
    role VARCHAR(100) NOT NULL,
    period_start DATE,
    period_end DATE,
    employment_status VARCHAR(20),
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resume_career_entries_resume_id
    ON resume_career_entries (resume_id);

CREATE INDEX IF NOT EXISTS idx_resume_career_entries_order
    ON resume_career_entries (resume_id, order_index);

CREATE TABLE IF NOT EXISTS resume_education_entries (
    id BIGSERIAL PRIMARY KEY,
    resume_id BIGINT NOT NULL
        CONSTRAINT fk_resume_education_entries_resume
            REFERENCES resumes
            ON DELETE CASCADE,
    school VARCHAR(200) NOT NULL,
    major VARCHAR(200) NOT NULL,
    degree VARCHAR(20),
    period_start DATE,
    period_end DATE,
    status VARCHAR(20),
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resume_education_entries_resume_id
    ON resume_education_entries (resume_id);

CREATE INDEX IF NOT EXISTS idx_resume_education_entries_order
    ON resume_education_entries (resume_id, order_index);

CREATE TABLE IF NOT EXISTS resume_self_introductions (
    id BIGSERIAL PRIMARY KEY,
    resume_id BIGINT NOT NULL
        CONSTRAINT fk_resume_self_introductions_resume
            REFERENCES resumes
            ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    answer_text TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resume_self_introductions_resume_id
    ON resume_self_introductions (resume_id);

CREATE INDEX IF NOT EXISTS idx_resume_self_introductions_order
    ON resume_self_introductions (resume_id, order_index);

CREATE TABLE IF NOT EXISTS profile_images (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL
        CONSTRAINT fk_profile_images_user
            REFERENCES users,
    image_url VARCHAR(1024) NOT NULL,
    image_key VARCHAR(512) NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profile_images_user_id
    ON profile_images (user_id);

CREATE TABLE IF NOT EXISTS resume_profiles (
    id BIGSERIAL PRIMARY KEY,
    resume_id BIGINT NOT NULL
        CONSTRAINT uk_resume_profiles_resume_id
            UNIQUE
        CONSTRAINT fk_resume_profiles_resume
            REFERENCES resumes
            ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    profile_image_id BIGINT
        CONSTRAINT fk_resume_profiles_profile_image
            REFERENCES profile_images
            ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_resume_profiles_resume_id
    ON resume_profiles (resume_id);

CREATE TABLE IF NOT EXISTS applicants (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    birth_date DATE,
    gender VARCHAR(20)
        CONSTRAINT applicants_gender_check
            CHECK ((gender)::text = ANY
                   ((ARRAY['MALE'::character varying, 'FEMALE'::character varying, 'OTHER'::character varying])::text[])),
    total_experience_years INTEGER,
    user_id BIGINT NOT NULL
        CONSTRAINT uk_applicants_user_id
            UNIQUE
        CONSTRAINT fk_applicants_user
            REFERENCES users
);

CREATE TABLE IF NOT EXISTS companies (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    address TEXT,
    busi_cont TEXT,
    cid VARCHAR(255)
        CONSTRAINT uktimeh0jas1clmnd90s5015lov
            UNIQUE,
    companies_name VARCHAR(500) NOT NULL
        CONSTRAINT ukpght2ej9aynpbiod8vdnu9o4w
            UNIQUE,
    homepage_url TEXT,
    logo TEXT,
    size VARCHAR(500),
    tot_psncnt VARCHAR(100),
    yr_sales_amt VARCHAR(100),
    user_id BIGINT
        CONSTRAINT uk5xg6ed73n32iai9psir68pia9
            UNIQUE
        CONSTRAINT fk9l5d0fem75e59uwf9upwuf9du
            REFERENCES users
);

CREATE TABLE IF NOT EXISTS company_project_analyses (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    company_id BIGINT NOT NULL
        CONSTRAINT uk_company_project_analyses_company_id
            UNIQUE
        CONSTRAINT fk_company_project_analyses_company
            REFERENCES companies
);

CREATE TABLE IF NOT EXISTS company_project_analysis_projects (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    domain VARCHAR(512),
    name VARCHAR(512) NOT NULL,
    problem VARCHAR(2000),
    solution VARCHAR(2000),
    analysis_id BIGINT NOT NULL
        CONSTRAINT fk_company_project_analysis_projects_analysis
            REFERENCES company_project_analyses
);

CREATE TABLE IF NOT EXISTS company_project_analysis_project_techs (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    tech VARCHAR(255) NOT NULL,
    project_id BIGINT NOT NULL
        CONSTRAINT fk_company_project_analysis_project_techs_project
            REFERENCES company_project_analysis_projects
);

CREATE INDEX IF NOT EXISTS idx_company_project_analysis_project_techs_project_id
    ON company_project_analysis_project_techs (project_id);

CREATE INDEX IF NOT EXISTS idx_company_project_analysis_projects_analysis_id
    ON company_project_analysis_projects (analysis_id);

CREATE TABLE IF NOT EXISTS company_scraps (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP(6),
    updated_at TIMESTAMP(6),
    company_cid VARCHAR(255) NOT NULL
        CONSTRAINT fk_company_scrap_company
            REFERENCES companies (cid)
            ON DELETE CASCADE,
    user_id BIGINT NOT NULL
        CONSTRAINT fklr0mrv217diyaqqg2389p7c0y
            REFERENCES users
        CONSTRAINT fk_company_scrap_user
            REFERENCES users
            ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS job_postings (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    active INTEGER NOT NULL,
    detail TEXT,
    end_date VARCHAR(255),
    job_type INTEGER NOT NULL,
    start_date VARCHAR(255),
    title VARCHAR(500),
    vcnt INTEGER NOT NULL,
    cid VARCHAR(255)
        CONSTRAINT fk_job_posting_company
            REFERENCES companies (cid)
);

CREATE TABLE IF NOT EXISTS scraps (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP(6),
    updated_at TIMESTAMP(6),
    job_posting_id BIGINT NOT NULL
        CONSTRAINT fk_scrap_job_posting
            REFERENCES job_postings
            ON DELETE CASCADE,
    user_id BIGINT NOT NULL
        CONSTRAINT fk_scrap_user
            REFERENCES users
            ON DELETE CASCADE,
    CONSTRAINT uknmq9kfp00v16dqo1u7ncgv10d
        UNIQUE (user_id, job_posting_id),
    CONSTRAINT uq_scrap_user_posting
        UNIQUE (user_id, job_posting_id),
    CONSTRAINT ukdaj9tddggswsjaovu9psv4all
        UNIQUE (user_id, job_posting_id)
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_job_posting_embeddings_job_posting'
    ) THEN
        ALTER TABLE job_posting_embeddings
            ADD CONSTRAINT fk_job_posting_embeddings_job_posting
                FOREIGN KEY (job_posting_id)
                REFERENCES job_postings
                ON DELETE CASCADE;
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS interview_schedule (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    status VARCHAR(255)
        CONSTRAINT interview_schedule_status_check
            CHECK ((status)::text = ANY
                   ((ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying, 'COMPLETED'::character varying, 'CANCELED'::character varying])::text[])),
    time TIMESTAMP(6),
    job_posting_id BIGINT
        CONSTRAINT fk_interview_schedule_job_posting
            REFERENCES job_postings
            ON DELETE CASCADE,
    users_id BIGINT
        CONSTRAINT fkhrx0bn8l4d2hqgl6hswsve8mr
            REFERENCES users
);

CREATE TABLE IF NOT EXISTS interview_rooms (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    applicant_peer_id VARCHAR(255),
    created_at TIMESTAMP(6),
    interviewer_peer_id VARCHAR(255),
    room_id VARCHAR(255) NOT NULL
        CONSTRAINT ukpjt62t57um0m3u7rvw4xnq9t4
            UNIQUE,
    status VARCHAR(255)
        CONSTRAINT interview_rooms_status_check
            CHECK ((status)::text = ANY
                   ((ARRAY['WAITING'::character varying, 'OPEN'::character varying, 'CLOSED'::character varying])::text[])),
    updated_at TIMESTAMP(6),
    schedule_id BIGINT NOT NULL
        CONSTRAINT uk_interview_rooms_schedule
            UNIQUE
        CONSTRAINT fks00pobwjbgdup84lvbquwhw1j
            REFERENCES interview_schedule
);

CREATE TABLE IF NOT EXISTS job_applications (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP(6),
    updated_at TIMESTAMP(6),
    resume_viewed BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(20) NOT NULL
        CONSTRAINT job_applications_status_check
            CHECK ((status)::text = ANY
                   ((ARRAY['APPLIED'::character varying, 'ACCEPTED'::character varying, 'REJECTED'::character varying])::text[])),
    job_posting_id BIGINT NOT NULL
        CONSTRAINT fk_job_applications_job_posting
            REFERENCES job_postings
            ON DELETE CASCADE,
    resume_id BIGINT
        CONSTRAINT fk_job_applications_resume
            REFERENCES resumes,
    user_id BIGINT NOT NULL
        CONSTRAINT fk_job_applications_user
            REFERENCES users,
    CONSTRAINT uk_job_applications_user_job_posting
        UNIQUE (user_id, job_posting_id)
);

CREATE TABLE IF NOT EXISTS job_application_resume_snapshots (
    job_application_id BIGINT NOT NULL
        PRIMARY KEY
        CONSTRAINT fk_job_application_resume_snapshots_application
            REFERENCES job_applications
            ON DELETE CASCADE,
    created_at TIMESTAMP(6),
    updated_at TIMESTAMP(6),
    payload_json TEXT NOT NULL,
    resume_id BIGINT
);

CREATE INDEX IF NOT EXISTS idx_job_applications_user_id
    ON job_applications (user_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_posting_id
    ON job_applications (job_posting_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_resume_id
    ON job_applications (resume_id);

CREATE TABLE IF NOT EXISTS portfolio_analyses (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    portfolio_id BIGINT NOT NULL
        CONSTRAINT uk_portfolio_analyses_portfolio_id
            UNIQUE
        CONSTRAINT fk_portfolio_analyses_portfolio
            REFERENCES portfolios
);

CREATE TABLE IF NOT EXISTS portfolio_analysis_projects (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    domain VARCHAR(512),
    name VARCHAR(512) NOT NULL,
    problem VARCHAR(2000),
    solution VARCHAR(2000),
    analysis_id BIGINT NOT NULL
        CONSTRAINT fk_portfolio_analysis_projects_analysis
            REFERENCES portfolio_analyses
);

CREATE TABLE IF NOT EXISTS portfolio_analysis_project_architecture_experiences (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    architecture_experience VARCHAR(255) NOT NULL,
    project_id BIGINT NOT NULL
        CONSTRAINT fk_portfolio_analysis_project_arch_exp_project
            REFERENCES portfolio_analysis_projects
);

CREATE INDEX IF NOT EXISTS idx_portfolio_analysis_project_arch_exp_project_id
    ON portfolio_analysis_project_architecture_experiences (project_id);

CREATE TABLE IF NOT EXISTS portfolio_analysis_project_keywords (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    project_id BIGINT NOT NULL
        CONSTRAINT fk_portfolio_analysis_project_keywords_project
            REFERENCES portfolio_analysis_projects
);

CREATE INDEX IF NOT EXISTS idx_portfolio_analysis_project_keywords_project_id
    ON portfolio_analysis_project_keywords (project_id);

CREATE TABLE IF NOT EXISTS portfolio_analysis_project_techs (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    tech VARCHAR(255) NOT NULL,
    project_id BIGINT NOT NULL
        CONSTRAINT fk_portfolio_analysis_project_techs_project
            REFERENCES portfolio_analysis_projects
);

CREATE INDEX IF NOT EXISTS idx_portfolio_analysis_project_techs_project_id
    ON portfolio_analysis_project_techs (project_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_analysis_projects_analysis_id
    ON portfolio_analysis_projects (analysis_id);

CREATE TABLE IF NOT EXISTS portfolio_query_histories (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP(6),
    updated_at TIMESTAMP(6),
    query_text TEXT NOT NULL,
    user_id BIGINT NOT NULL
        CONSTRAINT fk_portfolio_query_histories_user
            REFERENCES users
);

CREATE INDEX IF NOT EXISTS idx_portfolio_query_histories_user_id
    ON portfolio_query_histories (user_id);

CREATE TABLE IF NOT EXISTS portfolio_query_recommendation_results (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP(6),
    updated_at TIMESTAMP(6),
    portfolio_id BIGINT,
    portfolio_name VARCHAR(255),
    similarity DOUBLE PRECISION,
    user_id BIGINT,
    user_name VARCHAR(100),
    query_id BIGINT NOT NULL
        CONSTRAINT fk_portfolio_query_results_query
            REFERENCES portfolio_query_histories
);

CREATE INDEX IF NOT EXISTS idx_portfolio_query_results_query_id
    ON portfolio_query_recommendation_results (query_id);

CREATE TABLE IF NOT EXISTS posting_stacks (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    job_posting_id BIGINT
        CONSTRAINT fkjrkyig8lt8lqxu58826hm627d
            REFERENCES job_postings,
    stack_id BIGINT
        CONSTRAINT fk508phncu4yus4lfe954deidvj
            REFERENCES tech_stacks
);

CREATE TABLE IF NOT EXISTS job_posting_parsed (
    id BIGSERIAL PRIMARY KEY,
    job_posting_id BIGINT NOT NULL
        UNIQUE
        CONSTRAINT uk_job_posting_parsed_job_posting_id
            UNIQUE
        CONSTRAINT fk_job_posting_parsed_job_posting
            REFERENCES job_postings
            ON DELETE CASCADE,
    name VARCHAR(500),
    domain VARCHAR(100),
    problem TEXT,
    solution TEXT,
    tech TEXT,
    architecture_experience TEXT,
    keywords TEXT,
    content TEXT,
    content_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_posting_parsed_job_posting_id
    ON job_posting_parsed (job_posting_id);
