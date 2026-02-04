ALTER TABLE interview_rooms
    ADD COLUMN IF NOT EXISTS schedule_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_interview_rooms_schedule'
          AND conrelid = 'public.interview_rooms'::regclass
    ) THEN
        ALTER TABLE interview_rooms
            ADD CONSTRAINT fk_interview_rooms_schedule
            FOREIGN KEY (schedule_id)
            REFERENCES interview_schedule (id);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uk_interview_rooms_schedule
    ON interview_rooms (schedule_id);

ALTER TABLE interview_rooms
    ALTER COLUMN schedule_id SET NOT NULL;
