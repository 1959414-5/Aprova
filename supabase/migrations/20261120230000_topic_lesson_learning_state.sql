-- Persist per-topic learning marks so the lesson outline survives navigation and reloads.
ALTER TABLE public.topic_progress
  ADD COLUMN IF NOT EXISTS lesson_state jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.topic_progress
  DROP CONSTRAINT IF EXISTS topic_progress_lesson_state_object_check;

ALTER TABLE public.topic_progress
  ADD CONSTRAINT topic_progress_lesson_state_object_check
  CHECK (jsonb_typeof(lesson_state) = 'object');
