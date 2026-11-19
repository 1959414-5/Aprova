create table if not exists public.ai_tutor_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  input_chars integer not null default 0 check (input_chars >= 0),
  model text not null,
  response_status text not null default 'completed'
    check (response_status = any (array['completed'::text, 'failed'::text]))
);

create index if not exists ai_tutor_usage_user_created_idx
  on public.ai_tutor_usage(user_id, created_at desc);

alter table public.ai_tutor_usage enable row level security;
revoke all on table public.ai_tutor_usage from public, anon, authenticated;
drop policy if exists "No direct access to tutor usage" on public.ai_tutor_usage;
create policy "No direct access to tutor usage"
  on public.ai_tutor_usage for all to anon, authenticated
  using (false) with check (false);
