-- Estruturas adicionais do SBMG Aprova
-- topic_lessons guarda conteúdo didático compartilhado; topic_progress guarda avanço individual.

create table if not exists public.topic_lessons (
  topic_id uuid primary key references public.topics(id) on delete cascade,
  title text not null,
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  source_basis text not null default 'Edital 001/2026 - Anexo III',
  is_published boolean not null default false,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.topic_lessons enable row level security;
revoke all on table public.topic_lessons from public, anon, authenticated;
grant select on table public.topic_lessons to authenticated;
drop policy if exists "Authenticated can read published topic lessons" on public.topic_lessons;
create policy "Authenticated can read published topic lessons"
  on public.topic_lessons for select to authenticated
  using (is_published = true);

create table if not exists public.topic_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  status text not null default 'em_andamento'
    check (status = any (array['em_andamento'::text, 'concluido'::text, 'revisar'::text])),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  last_studied_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

create index if not exists topic_progress_topic_id_idx
  on public.topic_progress(topic_id);

alter table public.topic_progress enable row level security;
revoke all on table public.topic_progress from public, anon, authenticated;
grant select, insert, update, delete on table public.topic_progress to authenticated;

drop policy if exists "Users can read own topic progress" on public.topic_progress;
create policy "Users can read own topic progress"
  on public.topic_progress for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create own topic progress" on public.topic_progress;
create policy "Users can create own topic progress"
  on public.topic_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own topic progress" on public.topic_progress;
create policy "Users can update own topic progress"
  on public.topic_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own topic progress" on public.topic_progress;
create policy "Users can delete own topic progress"
  on public.topic_progress for delete to authenticated
  using ((select auth.uid()) = user_id);
