-- Explicit start and completion states for the six essay course lessons.
alter table public.essay_learning_progress
  add column if not exists status text not null default 'nao_iniciada'
    check (status = any (array['nao_iniciada'::text, 'em_andamento'::text, 'concluida'::text])),
  add column if not exists started_at timestamptz;

-- Preserve prior completion records and convert answered exercises to in-progress.
update public.essay_learning_progress
set status = case
  when completed = true then 'concluida'
  when exercise_answers <> '{}'::jsonb then 'em_andamento'
  else 'nao_iniciada'
end,
started_at = case
  when completed = true or exercise_answers <> '{}'::jsonb
    then coalesce(started_at, last_activity_at, created_at)
  else started_at
end,
completed_at = case
  when completed = true then coalesce(completed_at, last_activity_at, created_at)
  else completed_at
end,
updated_at = now();

-- Keep the existing RLS policies; grant only the columns needed by the owner-scoped client upsert.
revoke all on table public.essay_learning_progress from public, anon, authenticated;
grant select on table public.essay_learning_progress to authenticated;
grant insert (user_id, lesson_id, exercise_answers, completed, status, started_at, last_activity_at, completed_at, updated_at)
  on public.essay_learning_progress to authenticated;
grant update (user_id, lesson_id, exercise_answers, completed, status, started_at, last_activity_at, completed_at, updated_at)
  on public.essay_learning_progress to authenticated;
