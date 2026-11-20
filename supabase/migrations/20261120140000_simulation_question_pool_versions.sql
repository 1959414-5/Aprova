-- Three independent question pools for automatically rotating full simulations.
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS simulation_version text NOT NULL DEFAULT 'A';
ALTER TABLE public.questions ADD CONSTRAINT questions_simulation_version_check CHECK (simulation_version IN ('A','B','C'));
CREATE INDEX IF NOT EXISTS idx_questions_exam_simulation_version_published
  ON public.questions(exam_id, simulation_version) WHERE is_published = true;
COMMENT ON COLUMN public.questions.simulation_version IS 'Pool version A/B/C used for rotating complete 70-question simulations.';
