-- Run with supabase test db. These checks verify least-privilege grants and RLS remain enabled.
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.assessment_runs'::regclass) then
    raise exception 'RLS must remain enabled on assessment_runs';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.question_attempts'::regclass) then
    raise exception 'RLS must remain enabled on question_attempts';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.questions'::regclass) then
    raise exception 'RLS must remain enabled on questions';
  end if;

  if not has_column_privilege('authenticated', 'public.questions', 'statement', 'SELECT')
     or not has_column_privilege('authenticated', 'public.questions', 'options', 'SELECT')
     or not has_column_privilege('authenticated', 'public.questions', 'is_published', 'SELECT') then
    raise exception 'Authenticated must read published question content';
  end if;
  if has_column_privilege('authenticated', 'public.questions', 'correct_option', 'SELECT')
     or has_column_privilege('authenticated', 'public.questions', 'explanation', 'SELECT')
     or has_column_privilege('anon', 'public.questions', 'correct_option', 'SELECT') then
    raise exception 'Answer keys and explanations must not be exposed through the Data API';
  end if;

  if not has_column_privilege('authenticated', 'public.assessment_runs', 'user_id', 'INSERT')
     or not has_column_privilege('authenticated', 'public.assessment_runs', 'metadata', 'INSERT')
     or not has_column_privilege('authenticated', 'public.assessment_runs', 'id', 'SELECT') then
    raise exception 'Authenticated must be able to create and read back own assessment runs';
  end if;
  if has_column_privilege('authenticated', 'public.assessment_runs', 'score', 'UPDATE')
     or has_column_privilege('authenticated', 'public.assessment_runs', 'finished_at', 'UPDATE') then
    raise exception 'Assessment scoring/finalization must remain server-side';
  end if;

  if not has_column_privilege('authenticated', 'public.question_attempts', 'is_correct', 'SELECT')
     or has_column_privilege('authenticated', 'public.question_attempts', 'selected_option', 'SELECT')
     or has_column_privilege('authenticated', 'public.question_attempts', 'selected_option', 'INSERT') then
    raise exception 'Question attempts must be read-only and must not expose submitted options directly';
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname='public'
      and indexname='assessment_runs_one_open_diagnostic_per_user_idx'
  ) then
    raise exception 'The one-open-diagnostic unique index is missing';
  end if;
end;
$$;
