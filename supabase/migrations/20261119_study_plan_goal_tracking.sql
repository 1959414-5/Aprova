-- Meta do Plano Flexível por sessão de estudo.
-- O marco é gravado sem encerrar a sessão; o usuário decide quando salvar/cancelar.

alter table public.lesson_study_sessions
  add column if not exists planned_minutes integer not null default 40
    check (planned_minutes between 1 and 600),
  add column if not exists goal_reached_at timestamptz;

comment on column public.lesson_study_sessions.planned_minutes is
  'Meta de duração escolhida para a sessão, em minutos.';
comment on column public.lesson_study_sessions.goal_reached_at is
  'Momento em que a sessão atingiu a meta; a sessão continua ativa até o usuário salvá-la ou cancelá-la.';
