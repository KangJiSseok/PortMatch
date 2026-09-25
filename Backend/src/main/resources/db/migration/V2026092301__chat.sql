CREATE TABLE IF NOT EXISTS chat_room (
    id uuid PRIMARY KEY,
    room_type varchar(20) NOT NULL DEFAULT 'DIRECT',
    company_user_id bigint,
    applicant_user_id bigint,
    system_recipient_id bigint,
    last_message text,
    last_sender_id bigint,
    last_message_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ck_chat_room_members CHECK (
        (room_type='DIRECT' AND company_user_id IS NOT NULL AND applicant_user_id IS NOT NULL AND system_recipient_id IS NULL)
        OR (room_type='SYSTEM' AND company_user_id IS NULL AND applicant_user_id IS NULL AND system_recipient_id IS NOT NULL)
    )
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_chat_room_participants ON chat_room(company_user_id, applicant_user_id) WHERE room_type='DIRECT';
CREATE UNIQUE INDEX IF NOT EXISTS uk_chat_room_system_recipient ON chat_room(system_recipient_id) WHERE room_type='SYSTEM';

CREATE TABLE IF NOT EXISTS chat_room_member (
    room_id uuid NOT NULL REFERENCES chat_room(id) ON DELETE CASCADE,
    user_id bigint NOT NULL,
    last_read_sequence bigint NOT NULL DEFAULT 0,
    PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_room_sequence (
    room_id uuid PRIMARY KEY REFERENCES chat_room(id) ON DELETE CASCADE,
    next_sequence bigint NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS chat_message (
    id uuid PRIMARY KEY,
    room_id uuid NOT NULL REFERENCES chat_room(id) ON DELETE CASCADE,
    room_sequence bigint NOT NULL,
    sender_id bigint,
    client_message_id uuid NOT NULL,
    content text NOT NULL,
    message_type varchar(20) NOT NULL,
    interview_id bigint,
    job_posting_id bigint,
    job_posting_title varchar(500),
    created_at timestamptz NOT NULL,
    test_run_id varchar(100),
    CONSTRAINT uk_chat_message_room_sequence UNIQUE (room_id, room_sequence),
    CONSTRAINT uk_chat_message_sender_client UNIQUE (sender_id, client_message_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_message_room_sequence ON chat_message(room_id, room_sequence);
CREATE INDEX IF NOT EXISTS idx_chat_message_test_run ON chat_message(test_run_id);

CREATE TABLE IF NOT EXISTS chat_outbox (
    event_id uuid PRIMARY KEY,
    message_id uuid NOT NULL,
    payload jsonb NOT NULL,
    status varchar(20) NOT NULL,
    attempts integer NOT NULL DEFAULT 0,
    next_attempt_at timestamptz NOT NULL DEFAULT now(),
    lease_until timestamptz,
    last_error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_chat_outbox_poll ON chat_outbox(status, next_attempt_at);

CREATE TABLE IF NOT EXISTS chat_consumed_event (
    event_id uuid PRIMARY KEY,
    message_id uuid NOT NULL,
    test_run_id varchar(100),
    processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_consumer_attempt (
    id bigserial PRIMARY KEY,
    event_id uuid NOT NULL,
    message_id uuid NOT NULL,
    test_run_id varchar(100),
    attempted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_consumer_attempt_run ON chat_consumer_attempt(test_run_id);

CREATE TABLE IF NOT EXISTS chat_system_alert (
    id bigserial PRIMARY KEY,
    interview_id bigint NOT NULL,
    alert_type varchar(20) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uk_chat_system_alert UNIQUE (interview_id, alert_type)
);
