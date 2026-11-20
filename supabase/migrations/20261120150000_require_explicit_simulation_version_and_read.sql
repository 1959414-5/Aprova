-- Prevent accidental insertion into a completed pool and expose only the version label to authenticated clients.
ALTER TABLE public.questions ALTER COLUMN simulation_version DROP DEFAULT;
GRANT SELECT (simulation_version) ON TABLE public.questions TO authenticated;
