-- Security hardening and performance cleanup for public schema.
-- Applied to the Supabase production project on 2026-11-20.

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

DROP POLICY IF EXISTS "Users can read own review items" ON public.review_items;
DROP POLICY IF EXISTS "Users can update own review items" ON public.review_items;

DROP POLICY IF EXISTS "Users can insert own lesson study sessions" ON public.lesson_study_sessions;
DROP POLICY IF EXISTS "Users can update own lesson study sessions" ON public.lesson_study_sessions;
DROP POLICY IF EXISTS "Users can view own lesson study sessions" ON public.lesson_study_sessions;

CREATE POLICY "Users can insert own lesson study sessions" ON public.lesson_study_sessions
  FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own lesson study sessions" ON public.lesson_study_sessions
  FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can view own lesson study sessions" ON public.lesson_study_sessions
  FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS lesson_study_sessions_topic_id_idx
  ON public.lesson_study_sessions(topic_id);
