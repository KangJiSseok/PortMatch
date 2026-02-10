CREATE EXTENSION IF NOT EXISTS vector;

create table public.flyway_schema_history
(
    installed_rank integer                 not null
        constraint flyway_schema_history_pk
            primary key,
    version        varchar(50),
    description    varchar(200)            not null,
    type           varchar(20)             not null,
    script         varchar(1000)           not null,
    checksum       integer,
    installed_by   varchar(100)            not null,
    installed_on   timestamp default now() not null,
    execution_time integer                 not null,
    success        boolean                 not null
);

alter table public.flyway_schema_history
    owner to portmatch;

create index flyway_schema_history_s_idx
    on public.flyway_schema_history (success);

create table public.interview_templates
(
    id          bigserial
        primary key,
    user_id     bigint       not null,
    title       varchar(200) not null,
    target_role varchar(100) not null,
    created_at  timestamp    not null,
    updated_at  timestamp    not null
);

alter table public.interview_templates
    owner to portmatch;

create index idx_interview_templates_user_id
    on public.interview_templates (user_id);

create table public.interview_template_topics
(
    id          bigserial
        primary key,
    template_id bigint       not null
        constraint fk_interview_template_topics_template
            references public.interview_templates
            on delete cascade,
    name        varchar(200) not null,
    order_index integer      not null,
    created_at  timestamp    not null,
    updated_at  timestamp    not null
);

alter table public.interview_template_topics
    owner to portmatch;

create index idx_interview_template_topics_template_id
    on public.interview_template_topics (template_id);

create index idx_interview_template_topics_order
    on public.interview_template_topics (template_id, order_index);

create table public.interview_template_questions
(
    id           bigserial
        primary key,
    topic_id     bigint    not null
        constraint fk_interview_template_questions_topic
            references public.interview_template_topics
            on delete cascade,
    content      text      not null,
    order_index  integer   not null,
    created_at   timestamp not null,
    updated_at   timestamp not null,
    memo_content text
);

alter table public.interview_template_questions
    owner to portmatch;

create index idx_interview_template_questions_topic_id
    on public.interview_template_questions (topic_id);

create index idx_interview_template_questions_order
    on public.interview_template_questions (topic_id, order_index);

create table public.portfolio_user_tech_embeddings
(
    id           bigserial
        primary key,
    user_id      bigint                  not null,
    portfolio_id bigint                  not null,
    tech_text    varchar(512)            not null,
    embedding    vector(1536)            not null,
    created_at   timestamp default now() not null,
    updated_at   timestamp default now() not null,
    constraint uk_portfolio_user_tech_embeddings_portfolio_text
        unique (portfolio_id, tech_text)
);

alter table public.portfolio_user_tech_embeddings
    owner to portmatch;

create index idx_portfolio_user_tech_embeddings_user_id
    on public.portfolio_user_tech_embeddings (user_id);

create index idx_portfolio_user_tech_embeddings_portfolio_id
    on public.portfolio_user_tech_embeddings (portfolio_id);

create table public.portfolio_user_keyword_embeddings
(
    id           bigserial
        primary key,
    user_id      bigint                  not null,
    portfolio_id bigint                  not null,
    keyword_text varchar(512)            not null,
    embedding    vector(1536)            not null,
    created_at   timestamp default now() not null,
    updated_at   timestamp default now() not null,
    constraint uk_portfolio_user_keyword_embeddings_portfolio_text
        unique (portfolio_id, keyword_text)
);

alter table public.portfolio_user_keyword_embeddings
    owner to portmatch;

create index idx_portfolio_user_keyword_embeddings_user_id
    on public.portfolio_user_keyword_embeddings (user_id);

create index idx_portfolio_user_keyword_embeddings_portfolio_id
    on public.portfolio_user_keyword_embeddings (portfolio_id);

create table public.portfolio_user_architecture_embeddings
(
    id                bigserial
        primary key,
    user_id           bigint                  not null,
    portfolio_id      bigint                  not null,
    architecture_text varchar(512)            not null,
    embedding         vector(1536)            not null,
    created_at        timestamp default now() not null,
    updated_at        timestamp default now() not null,
    constraint uk_portfolio_user_architecture_embeddings_portfolio_text
        unique (portfolio_id, architecture_text)
);

alter table public.portfolio_user_architecture_embeddings
    owner to portmatch;

create index idx_portfolio_user_architecture_embeddings_user_id
    on public.portfolio_user_architecture_embeddings (user_id);

create index idx_portfolio_user_architecture_embeddings_portfolio_id
    on public.portfolio_user_architecture_embeddings (portfolio_id);

create table public.portfolio_user_unified_embeddings
(
    id           bigserial
        primary key,
    user_id      bigint                  not null,
    portfolio_id bigint                  not null
        constraint uk_portfolio_user_unified_embeddings_portfolio
            unique,
    unified_text varchar(4000)           not null,
    embedding    vector(1536),
    created_at   timestamp default now() not null,
    updated_at   timestamp default now() not null
);

alter table public.portfolio_user_unified_embeddings
    owner to portmatch;

create index idx_portfolio_user_unified_embeddings_user_id
    on public.portfolio_user_unified_embeddings (user_id);

create index idx_portfolio_user_unified_embeddings_portfolio_id
    on public.portfolio_user_unified_embeddings (portfolio_id);

create table public.portfolio_user_job_posting_embeddings
(
    id                     bigserial
        primary key,
    user_id                bigint                not null,
    portfolio_id           bigint                not null
        constraint uk_portfolio_user_job_posting_embeddings_portfolio
            unique,
    content                text                  not null,
    content_hash           varchar(64)           not null,
    name_embedding         vector(1536),
    domain_embedding       vector(1536),
    problem_embedding      vector(1536),
    tech_embedding         vector(1536),
    architecture_embedding vector(1536),
    problem_missing        boolean default false not null,
    tech_missing           boolean default false not null,
    architecture_missing   boolean default false not null,
    created_at             timestamp             not null,
    updated_at             timestamp             not null
);

alter table public.portfolio_user_job_posting_embeddings
    owner to portmatch;

create index idx_portfolio_user_job_posting_embeddings_user_id
    on public.portfolio_user_job_posting_embeddings (user_id);

create index idx_portfolio_user_job_posting_embeddings_portfolio_id
    on public.portfolio_user_job_posting_embeddings (portfolio_id);

create table public.company_project_embeddings
(
    id                 bigint generated by default as identity
        primary key,
    analysis_id        bigint       not null,
    company_id         bigint       not null,
    content            text         not null,
    created_at         timestamp(6) not null,
    domain_embedding   vector(1536),
    problem_embedding  vector(1536),
    problem_missing    boolean      not null,
    project_embedding  vector(1536),
    project_id         bigint       not null
        constraint uk_company_project_embeddings_project_id
            unique,
    solution_embedding vector(1536),
    solution_missing   boolean      not null,
    tech_embedding     vector(1536),
    tech_missing       boolean      not null,
    updated_at         timestamp(6) not null
);

alter table public.company_project_embeddings
    owner to portmatch;

create table public.interview_session_entity
(
    id         bigint generated by default as identity
        primary key,
    created_at timestamp(6),
    session_id varchar(255) not null
        constraint uk9p38pef2wsdurg2bh4gcky253
            unique,
    status     varchar(255)
        constraint interview_session_entity_status_check
            check ((status)::text = ANY ((ARRAY ['OPEN'::character varying, 'FINISHED'::character varying])::text[])),
    title      varchar(255)
);

alter table public.interview_session_entity
    owner to portmatch;

create table public.portfolio_project_embeddings
(
    id                     bigint generated by default as identity
        primary key,
    analysis_id            bigint       not null,
    architecture_embedding vector(1536),
    architecture_missing   boolean      not null,
    content                text         not null,
    content_hash           varchar(64)  not null,
    created_at             timestamp(6) not null,
    domain_embedding       vector(1536),
    keywords_missing       boolean      not null,
    portfolio_id           bigint       not null,
    problem_embedding      vector(1536),
    problem_missing        boolean      not null,
    project_embedding      vector(1536),
    project_id             bigint       not null
        constraint uk_portfolio_project_embeddings_project_id
            unique,
    solution_embedding     vector(1536),
    solution_missing       boolean      not null,
    tech_embedding         vector(1536),
    tech_missing           boolean      not null,
    updated_at             timestamp(6) not null
);

alter table public.portfolio_project_embeddings
    owner to portmatch;

create table public.tech_stacks
(
    id         bigint       not null
        primary key,
    stack_name varchar(255) not null
        constraint ukgbit8fqyir1m7aslugsbmaux
            unique
);

alter table public.tech_stacks
    owner to portmatch;

create table public.users
(
    id         bigint generated by default as identity
        primary key,
    created_at timestamp(6) not null,
    email      varchar(100) not null
        constraint uk6dotkott2kjsp8vw4d0m25fb7
            unique,
    name       varchar(50)  not null,
    password   varchar(255) not null,
    phone      varchar(20)  not null,
    role       varchar(30)  not null
        constraint users_role_check
            check ((role)::text = ANY
                   ((ARRAY ['APPLICANT'::character varying, 'COMPANY'::character varying, 'ADMIN'::character varying])::text[])),
    username   varchar(50)  not null
        constraint ukr43af9ap4edm43mmtq01oddj6
            unique
);

alter table public.users
    owner to portmatch;

create table public.portfolios
(
    id                bigserial
        primary key,
    user_id           bigint                not null
        constraint fk_portfolios_user
            references public.users,
    s3_key            varchar(512)          not null,
    file_url          varchar(1024)         not null,
    original_filename varchar(255)          not null,
    content_type      varchar(255),
    file_size         bigint                not null,
    created_at        timestamp             not null,
    is_main           boolean default false not null
);

alter table public.portfolios
    owner to portmatch;

create table public.resumes
(
    id           bigserial
        primary key,
    user_id      bigint       not null
        constraint fk_resumes_user
            references public.users,
    title        varchar(200) not null,
    is_main      boolean      not null,
    created_at   timestamp    not null,
    updated_at   timestamp    not null,
    portfolio_id bigint
        constraint fk_resumes_portfolio
            references public.portfolios
            on delete set null
);

alter table public.resumes
    owner to portmatch;

create index idx_resumes_user_id
    on public.resumes (user_id);

create unique index uk_resumes_user_main
    on public.resumes (user_id)
    where (is_main = true);

create unique index uk_resumes_portfolio_id
    on public.resumes (portfolio_id)
    where (portfolio_id IS NOT NULL);

create table public.resume_career_entries
(
    id                bigserial
        primary key,
    resume_id         bigint       not null
        constraint fk_resume_career_entries_resume
            references public.resumes
            on delete cascade,
    company           varchar(200) not null,
    role              varchar(100) not null,
    period_start      date,
    period_end        date,
    employment_status varchar(20),
    description       text,
    order_index       integer      not null,
    created_at        timestamp    not null,
    updated_at        timestamp    not null
);

alter table public.resume_career_entries
    owner to portmatch;

create index idx_resume_career_entries_resume_id
    on public.resume_career_entries (resume_id);

create index idx_resume_career_entries_order
    on public.resume_career_entries (resume_id, order_index);

create table public.resume_education_entries
(
    id           bigserial
        primary key,
    resume_id    bigint       not null
        constraint fk_resume_education_entries_resume
            references public.resumes
            on delete cascade,
    school       varchar(200) not null,
    major        varchar(200) not null,
    degree       varchar(20),
    period_start date,
    period_end   date,
    status       varchar(20),
    order_index  integer      not null,
    created_at   timestamp    not null,
    updated_at   timestamp    not null
);

alter table public.resume_education_entries
    owner to portmatch;

create index idx_resume_education_entries_resume_id
    on public.resume_education_entries (resume_id);

create index idx_resume_education_entries_order
    on public.resume_education_entries (resume_id, order_index);

create table public.resume_self_introductions
(
    id          bigserial
        primary key,
    resume_id   bigint       not null
        constraint fk_resume_self_introductions_resume
            references public.resumes
            on delete cascade,
    title       varchar(200) not null,
    order_index integer      not null,
    created_at  timestamp    not null,
    updated_at  timestamp    not null,
    answer_text text         not null
);

alter table public.resume_self_introductions
    owner to portmatch;

create index idx_resume_self_introductions_resume_id
    on public.resume_self_introductions (resume_id);

create index idx_resume_self_introductions_order
    on public.resume_self_introductions (resume_id, order_index);

create index idx_portfolios_user_id
    on public.portfolios (user_id);

create table public.profile_images
(
    id         bigserial
        primary key,
    user_id    bigint        not null
        constraint fk_profile_images_user
            references public.users,
    image_url  varchar(1024) not null,
    image_key  varchar(512)  not null,
    image_name varchar(255)  not null,
    created_at timestamp     not null
);

alter table public.profile_images
    owner to portmatch;

create table public.resume_profiles
(
    id               bigserial
        primary key,
    resume_id        bigint       not null
        constraint uk_resume_profiles_resume_id
            unique
        constraint fk_resume_profiles_resume
            references public.resumes
            on delete cascade,
    name             varchar(100) not null,
    contact          varchar(50),
    email            varchar(255) not null,
    address          varchar(500),
    created_at       timestamp    not null,
    updated_at       timestamp    not null,
    profile_image_id bigint
        constraint fk_resume_profiles_profile_image
            references public.profile_images
            on delete set null
);

alter table public.resume_profiles
    owner to portmatch;

create index idx_resume_profiles_resume_id
    on public.resume_profiles (resume_id);

create index idx_profile_images_user_id
    on public.profile_images (user_id);

create table public.applicants
(
    id                     bigint generated by default as identity
        primary key,
    birth_date             date,
    gender                 varchar(20)
        constraint applicants_gender_check
            check ((gender)::text = ANY
                   ((ARRAY ['MALE'::character varying, 'FEMALE'::character varying, 'OTHER'::character varying])::text[])),
    total_experience_years integer,
    user_id                bigint not null
        constraint uk_applicants_user_id
            unique
        constraint fk_applicants_user
            references public.users
);

alter table public.applicants
    owner to portmatch;

create table public.companies
(
    id             bigint generated by default as identity
        primary key,
    address        text,
    busi_cont      text,
    cid            varchar(255)
        constraint uktimeh0jas1clmnd90s5015lov
            unique,
    companies_name varchar(500) not null
        constraint ukpght2ej9aynpbiod8vdnu9o4w
            unique,
    homepage_url   text,
    logo           text,
    size           varchar(500),
    tot_psncnt     varchar(100),
    yr_sales_amt   varchar(100),
    user_id        bigint
        constraint uk5xg6ed73n32iai9psir68pia9
            unique
        constraint fk9l5d0fem75e59uwf9upwuf9du
            references public.users
);

alter table public.companies
    owner to portmatch;

create table public.company_project_analyses
(
    id         bigint generated by default as identity
        primary key,
    created_at timestamp(6) not null,
    updated_at timestamp(6) not null,
    company_id bigint       not null
        constraint uk_company_project_analyses_company_id
            unique
        constraint fk_company_project_analyses_company
            references public.companies
);

alter table public.company_project_analyses
    owner to portmatch;

create table public.company_project_analysis_projects
(
    id          bigint generated by default as identity
        primary key,
    domain      varchar(512),
    name        varchar(512) not null,
    problem     varchar(2000),
    solution    varchar(2000),
    analysis_id bigint       not null
        constraint fk_company_project_analysis_projects_analysis
            references public.company_project_analyses
);

alter table public.company_project_analysis_projects
    owner to portmatch;

create table public.company_project_analysis_project_techs
(
    id         bigint generated by default as identity
        primary key,
    tech       varchar(255) not null,
    project_id bigint       not null
        constraint fk_company_project_analysis_project_techs_project
            references public.company_project_analysis_projects
);

alter table public.company_project_analysis_project_techs
    owner to portmatch;

create index idx_company_project_analysis_project_techs_project_id
    on public.company_project_analysis_project_techs (project_id);

create index idx_company_project_analysis_projects_analysis_id
    on public.company_project_analysis_projects (analysis_id);

create table public.company_scraps
(
    id          bigint generated by default as identity
        primary key,
    created_at  timestamp(6),
    updated_at  timestamp(6),
    company_cid varchar(255) not null
        constraint fk_company_scrap_company
            references public.companies (cid)
            on delete cascade,
    user_id     bigint       not null
        constraint fklr0mrv217diyaqqg2389p7c0y
            references public.users
        constraint fk_company_scrap_user
            references public.users
            on delete cascade
);

alter table public.company_scraps
    owner to portmatch;

create table public.job_postings
(
    id         bigint generated by default as identity
        primary key,
    active     integer not null,
    detail     text,
    end_date   varchar(255),
    job_type   integer not null,
    start_date varchar(255),
    title      varchar(500),
    vcnt       integer not null,
    cid        varchar(255)
        constraint fk_job_posting_company
            references public.companies (cid)
);

alter table public.job_postings
    owner to portmatch;

create table public.interview_schedule
(
    id             bigint generated by default as identity
        primary key,
    status         varchar(255)
        constraint interview_schedule_status_check
            check ((status)::text = ANY
                   ((ARRAY ['PENDING'::character varying, 'CONFIRMED'::character varying, 'COMPLETED'::character varying, 'CANCELED'::character varying])::text[])),
    time           timestamp(6),
    job_posting_id bigint
        constraint fk_interview_schedule_job_posting
            references public.job_postings
            on delete cascade,
    users_id       bigint
        constraint fkhrx0bn8l4d2hqgl6hswsve8mr
            references public.users
);

alter table public.interview_schedule
    owner to portmatch;

create table public.interview_rooms
(
    id                  bigint generated by default as identity
        primary key,
    applicant_peer_id   varchar(255),
    created_at          timestamp(6),
    interviewer_peer_id varchar(255),
    room_id             varchar(255) not null
        constraint ukpjt62t57um0m3u7rvw4xnq9t4
            unique,
    status              varchar(255)
        constraint interview_rooms_status_check
            check ((status)::text = ANY
                   ((ARRAY ['WAITING'::character varying, 'OPEN'::character varying, 'CLOSED'::character varying])::text[])),
    updated_at          timestamp(6),
    schedule_id         bigint       not null
        constraint uk_interview_rooms_schedule
            unique
        constraint fks00pobwjbgdup84lvbquwhw1j
            references public.interview_schedule
);

alter table public.interview_rooms
    owner to portmatch;

create table public.job_applications
(
    id             bigint generated by default as identity
        primary key,
    created_at     timestamp(6),
    updated_at     timestamp(6),
    resume_viewed  boolean default false not null,
    status         varchar(20)           not null
        constraint job_applications_status_check
            check ((status)::text = ANY
                   ((ARRAY ['APPLIED'::character varying, 'ACCEPTED'::character varying, 'REJECTED'::character varying])::text[])),
    job_posting_id bigint                not null
        constraint fk_job_applications_job_posting
            references public.job_postings
            on delete cascade,
    resume_id      bigint
        constraint fk_job_applications_resume
            references public.resumes,
    user_id        bigint                not null
        constraint fk_job_applications_user
            references public.users,
    constraint uk_job_applications_user_job_posting
        unique (user_id, job_posting_id)
);

alter table public.job_applications
    owner to portmatch;

create table public.job_application_resume_snapshots
(
    job_application_id bigint not null
        primary key
        constraint fk_job_application_resume_snapshots_application
            references public.job_applications
            on delete cascade,
    created_at         timestamp(6),
    updated_at         timestamp(6),
    payload_json       text   not null,
    resume_id          bigint
);

alter table public.job_application_resume_snapshots
    owner to portmatch;

create index idx_job_applications_user_id
    on public.job_applications (user_id);

create index idx_job_applications_job_posting_id
    on public.job_applications (job_posting_id);

create index idx_job_applications_resume_id
    on public.job_applications (resume_id);

create table public.job_posting_embeddings
(
    id                      bigint generated by default as identity
        primary key,
    architecture_embedding  vector(1536),
    architecture_experience text,
    content                 text,
    content_hash            varchar(64),
    created_at              timestamp(6)          not null,
    domain                  varchar(100),
    domain_embedding        vector(1536),
    job_posting_id          bigint                not null
        constraint uk_job_posting_embeddings_job_posting_id
            unique
        constraint fk_job_posting_embeddings_job_posting
            references public.job_postings
            on delete cascade,
    keywords                text,
    keywords_embedding      vector(1536),
    name                    varchar(500),
    name_embedding          vector(1536),
    problem                 text,
    problem_embedding       vector(1536),
    problem_missing         boolean               not null,
    solution                text,
    solution_embedding      vector(1536),
    solution_missing        boolean               not null,
    tech                    text,
    tech_embedding          vector(1536),
    tech_missing            boolean               not null,
    updated_at              timestamp(6)          not null,
    architecture_missing    boolean default false not null
);

alter table public.job_posting_embeddings
    owner to portmatch;

create index idx_job_posting_embeddings_job_posting_id
    on public.job_posting_embeddings (job_posting_id);

create table public.portfolio_analyses
(
    id           bigint generated by default as identity
        primary key,
    created_at   timestamp(6) not null,
    updated_at   timestamp(6) not null,
    portfolio_id bigint       not null
        constraint uk_portfolio_analyses_portfolio_id
            unique
        constraint fk_portfolio_analyses_portfolio
            references public.portfolios
);

alter table public.portfolio_analyses
    owner to portmatch;

create table public.portfolio_analysis_projects
(
    id          bigint generated by default as identity
        primary key,
    domain      varchar(512),
    name        varchar(512) not null,
    problem     varchar(2000),
    solution    varchar(2000),
    analysis_id bigint       not null
        constraint fk_portfolio_analysis_projects_analysis
            references public.portfolio_analyses
);

alter table public.portfolio_analysis_projects
    owner to portmatch;

create table public.portfolio_analysis_project_architecture_experiences
(
    id                      bigint generated by default as identity
        primary key,
    architecture_experience varchar(255) not null,
    project_id              bigint       not null
        constraint fk_portfolio_analysis_project_arch_exp_project
            references public.portfolio_analysis_projects
);

alter table public.portfolio_analysis_project_architecture_experiences
    owner to portmatch;

create index idx_portfolio_analysis_project_arch_exp_project_id
    on public.portfolio_analysis_project_architecture_experiences (project_id);

create table public.portfolio_analysis_project_keywords
(
    id         bigint generated by default as identity
        primary key,
    keyword    varchar(255) not null,
    project_id bigint       not null
        constraint fk_portfolio_analysis_project_keywords_project
            references public.portfolio_analysis_projects
);

alter table public.portfolio_analysis_project_keywords
    owner to portmatch;

create index idx_portfolio_analysis_project_keywords_project_id
    on public.portfolio_analysis_project_keywords (project_id);

create table public.portfolio_analysis_project_techs
(
    id         bigint generated by default as identity
        primary key,
    tech       varchar(255) not null,
    project_id bigint       not null
        constraint fk_portfolio_analysis_project_techs_project
            references public.portfolio_analysis_projects
);

alter table public.portfolio_analysis_project_techs
    owner to portmatch;

create index idx_portfolio_analysis_project_techs_project_id
    on public.portfolio_analysis_project_techs (project_id);

create index idx_portfolio_analysis_projects_analysis_id
    on public.portfolio_analysis_projects (analysis_id);

create table public.portfolio_query_histories
(
    id         bigint generated by default as identity
        primary key,
    created_at timestamp(6),
    updated_at timestamp(6),
    query_text text   not null,
    user_id    bigint not null
        constraint fk_portfolio_query_histories_user
            references public.users
);

alter table public.portfolio_query_histories
    owner to portmatch;

create index idx_portfolio_query_histories_user_id
    on public.portfolio_query_histories (user_id);

create table public.portfolio_query_recommendation_results
(
    id             bigint generated by default as identity
        primary key,
    created_at     timestamp(6),
    updated_at     timestamp(6),
    portfolio_id   bigint,
    portfolio_name varchar(255),
    similarity     double precision,
    user_id        bigint,
    user_name      varchar(100),
    query_id       bigint not null
        constraint fk_portfolio_query_results_query
            references public.portfolio_query_histories
);

alter table public.portfolio_query_recommendation_results
    owner to portmatch;

create index idx_portfolio_query_results_query_id
    on public.portfolio_query_recommendation_results (query_id);

create table public.posting_stacks
(
    id             bigint generated by default as identity
        primary key,
    job_posting_id bigint
        constraint fkjrkyig8lt8lqxu58826hm627d
            references public.job_postings,
    stack_id       bigint
        constraint fk508phncu4yus4lfe954deidvj
            references public.tech_stacks
);

alter table public.posting_stacks
    owner to portmatch;

create table public.job_posting_parsed
(
    id                      bigserial
        primary key,
    job_posting_id          bigint not null
        unique
        constraint uk_job_posting_parsed_job_posting_id
            unique
        constraint fk_job_posting_parsed_job_posting
            references public.job_postings
            on delete cascade,
    name                    varchar(500),
    domain                  varchar(100),
    problem                 text,
    solution                text,
    tech                    text,
    architecture_experience text,
    keywords                text,
    content                 text,
    content_hash            varchar(64),
    created_at              timestamp default now(),
    updated_at              timestamp default now()
);

alter table public.job_posting_parsed
    owner to portmatch;

create index idx_job_posting_parsed_job_posting_id
    on public.job_posting_parsed (job_posting_id);

create table public.scraps
(
    id         bigint generated by default as identity
        primary key,
    created_at timestamp(6),
    updated_at timestamp(6),
    pid        bigint not null
        constraint fkerkf0ukjghvekbuyshyym1yqx
            references public.job_postings,
    user_id    bigint not null
        constraint fkqd3nh3tj8ru0ubnk54qckuh42
            references public.users,
    constraint ukkuh15mg96gyklb9ja5oc1uavu
        unique (user_id, pid)
);

alter table public.scraps
    owner to portmatch;
