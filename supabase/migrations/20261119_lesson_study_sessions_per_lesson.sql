-- Sessões independentes por aula (tópicos do edital e curso de redação).
-- Cada início cria uma linha; salvar/finalizar atualiza a mesma linha com segundos exatos.

create table if not exists public.lesson_study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_type text not null check (lesson_type in ('topico', 'redacao')),
  topic_id uuid references public.topics(id) on delete set null,
  essay_lesson_id text,
  lesson_title text not null,
  status text not null default 'em_andamento'
    check (status in ('em_andamento', 'salva', 'cancelada')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  created_at timestamptz not null default now(),
  constraint lesson_study_sessions_reference_check check (
    (lesson_type = 'topico' and topic_id is not null and essay_lesson_id is null)
    or
    (lesson_type = 'redacao' and topic_id is null and essay_lesson_id is not null)
  ),
  constraint lesson_study_sessions_end_state_check check (
    (status = 'em_andamento' and ended_at is null)
    or
    (status in ('salva', 'cancelada') and ended_at is not null)
  )
);

create unique index if not exists lesson_study_sessions_one_active_per_user
  on public.lesson_study_sessions(user_id)
  where status = 'em_andamento';

create index if not exists lesson_study_sessions_user_started_at_idx
  on public.lesson_study_sessions(user_id, started_at desc);

alter table public.lesson_study_sessions enable row level security;

drop policy if exists "Users can view own lesson study sessions" on public.lesson_study_sessions;
create policy "Users can view own lesson study sessions"
  on public.lesson_study_sessions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own lesson study sessions" on public.lesson_study_sessions;
create policy "Users can insert own lesson study sessions"
  on public.lesson_study_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own lesson study sessions" on public.lesson_study_sessions;
create policy "Users can update own lesson study sessions"
  on public.lesson_study_sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

revoke all on table public.lesson_study_sessions from anon;
revoke delete, truncate, references, trigger on table public.lesson_study_sessions from authenticated;
grant select, insert, update on table public.lesson_study_sessions to authenticated;
