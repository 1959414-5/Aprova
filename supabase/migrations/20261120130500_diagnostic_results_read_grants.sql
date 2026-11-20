-- Restore authenticated access needed by the diagnostic result recovery UI.
-- RLS policies still restrict rows to the current user's own records.
GRANT SELECT, INSERT, UPDATE ON TABLE public.assessment_runs TO authenticated;
GRANT SELECT, INSERT ON TABLE public.question_attempts TO authenticated;
