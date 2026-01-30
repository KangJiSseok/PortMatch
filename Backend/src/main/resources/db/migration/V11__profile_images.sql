CREATE TABLE IF NOT EXISTS profile_images (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    image_url VARCHAR(1024) NOT NULL,
    image_key VARCHAR(512) NOT NULL,
    image_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profile_images_user_id
    ON profile_images (user_id);

DO $$
BEGIN
    IF to_regclass('public.users') IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_profile_images_user'
    ) THEN
        ALTER TABLE profile_images
            ADD CONSTRAINT fk_profile_images_user
            FOREIGN KEY (user_id)
            REFERENCES users (id)
            ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE resume_profiles
    ADD COLUMN IF NOT EXISTS profile_image_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_resume_profiles_profile_image'
    ) THEN
        ALTER TABLE resume_profiles
            ADD CONSTRAINT fk_resume_profiles_profile_image
            FOREIGN KEY (profile_image_id)
            REFERENCES profile_images (id)
            ON DELETE SET NULL;
    END IF;
END $$;

WITH source AS (
    SELECT rp.resume_id,
           r.user_id,
           rp.profile_image_url,
           rp.profile_image_key,
           rp.profile_image_name,
           rp.created_at
    FROM resume_profiles rp
    JOIN resumes r ON r.id = rp.resume_id
    WHERE rp.profile_image_url IS NOT NULL
),
inserted AS (
    INSERT INTO profile_images (user_id, image_url, image_key, image_name, created_at)
    SELECT user_id, profile_image_url, profile_image_key, profile_image_name, created_at
    FROM source
    RETURNING id, user_id, image_url, image_key, image_name, created_at
),
mapping AS (
    SELECT s.resume_id, i.id
    FROM source s
    JOIN inserted i ON i.user_id = s.user_id
        AND i.image_url = s.profile_image_url
        AND i.image_key = s.profile_image_key
        AND i.image_name = s.profile_image_name
        AND i.created_at = s.created_at
)
UPDATE resume_profiles rp
SET profile_image_id = m.id
FROM mapping m
WHERE rp.resume_id = m.resume_id;

ALTER TABLE resume_profiles
    DROP COLUMN IF EXISTS profile_image_url,
    DROP COLUMN IF EXISTS profile_image_key,
    DROP COLUMN IF EXISTS profile_image_name;
