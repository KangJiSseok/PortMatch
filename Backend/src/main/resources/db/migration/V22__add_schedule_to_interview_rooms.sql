ALTER TABLE IF EXISTS interview_rooms
    ADD COLUMN IF NOT EXISTS schedule_id BIGINT;

DO $$
BEGIN
    IF to_regclass('public.interview_rooms') IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM pg_constraint
         WHERE conname = 'fk_interview_rooms_schedule'
           AND conrelid = to_regclass('public.interview_rooms')
       ) THEN
        ALTER TABLE interview_rooms
            ADD CONSTRAINT fk_interview_rooms_schedule
            FOREIGN KEY (schedule_id)
            REFERENCES interview_schedule (id);
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'interview_rooms'
    ) THEN
        EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS uk_interview_rooms_schedule ON interview_rooms (schedule_id)';
    END IF;
END $$;

ALTER TABLE IF EXISTS interview_rooms
    ALTER COLUMN schedule_id SET NOT NULL;
