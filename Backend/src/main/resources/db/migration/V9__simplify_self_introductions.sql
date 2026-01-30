ALTER TABLE resume_self_introductions
    ADD COLUMN IF NOT EXISTS answer_text TEXT NOT NULL DEFAULT '';

WITH first_question AS (
    SELECT DISTINCT ON (q.self_introduction_id)
        q.self_introduction_id,
        q.question_text,
        q.id AS question_id
    FROM resume_self_intro_questions q
    ORDER BY q.self_introduction_id, q.order_index ASC, q.id ASC
),
answer_by_question AS (
    SELECT a.question_id, a.answer_text
    FROM resume_self_intro_answers a
)
UPDATE resume_self_introductions si
SET title = fq.question_text,
    answer_text = COALESCE(abq.answer_text, '')
FROM first_question fq
LEFT JOIN answer_by_question abq ON abq.question_id = fq.question_id
WHERE si.id = fq.self_introduction_id;

ALTER TABLE resume_self_introductions
    ALTER COLUMN answer_text DROP DEFAULT;

DROP TABLE IF EXISTS resume_self_intro_answers;
DROP TABLE IF EXISTS resume_self_intro_questions;
