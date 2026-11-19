-- Secure assessment attempts and server-side score calculation.

create unique index if not exists question_attempts_one_per_question_per_run_idx
  on public.question_attempts(assessment_run_id, question_id)
  where assessment_run_id is not null;

alter table public.assessment_runs enable row level security;
alter table public.question_attempts enable row level security;

drop policy if exists "User manages own assessment runs" on public.assessment_runs;
drop policy if exists "Users can read own assessment runs" on public.assessment_runs;
drop policy if exists "Users can create own assessment runs" on public.assessment_runs;

create policy "Users can read own assessment runs"
  on public.assessment_runs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Users can create own assessment runs"
  on public.assessment_runs for insert to authenticated
  with check ((select auth.uid()) = user_id);

revoke all on table public.assessment_runs from public, anon;
revoke insert, update, delete on table public.assessment_runs from authenticated;
grant select on table public.assessment_runs to authenticated;
grant insert (user_id, exam_id, run_type, title, question_count, metadata)
  on public.assessment_runs to authenticated;

drop policy if exists "User manages own question attempts" on public.question_attempts;
drop policy if exists "Users can read attempts outside open runs" on public.question_attempts;
create policy "Users can read attempts outside open runs"
  on public.question_attempts for select to authenticated
  using (
    (select auth.uid()) = user_id
    and (
      assessment_run_id is null
      or exists (
        select 1 from public.assessment_runs ar
        where ar.id = assessment_run_id
          and ar.user_id = (select auth.uid())
          and ar.finished_at is not null
      )
    )
  );

revoke all on table public.question_attempts from public, anon;
revoke insert, update, delete on table public.question_attempts from authenticated;
grant select on table public.question_attempts to authenticated;
