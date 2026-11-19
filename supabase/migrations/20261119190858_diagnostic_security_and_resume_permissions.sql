-- Corrige privilégios Data API mantendo RLS e limitando o que o navegador pode acessar.
alter table public.assessment_runs enable row level security;
alter table public.question_attempts enable row level security;
alter table public.questions enable row level security;

-- Remove tentativas diagnósticas vazias duplicadas, preservando a mais recente por conta/concurso.
-- Nenhuma resposta é excluída: somente runs sem respostas são encerrados como abandonados.
with ranked_runs as (
  select
    ar.id,
    ar.user_id,
    ar.exam_id,
    ar.started_at,
    count(qa.id)::integer as answered_count,
    row_number() over (
      partition by ar.user_id, ar.exam_id, ar.run_type
      order by count(qa.id) desc, ar.started_at desc, ar.id
    ) as run_rank
  from public.assessment_runs ar
  left join public.question_attempts qa
    on qa.assessment_run_id = ar.id
   and qa.user_id = ar.user_id
  where ar.run_type = 'diagnostico'
    and ar.finished_at is null
  group by ar.id
)
update public.assessment_runs ar
set
  finished_at = now(),
  duration_seconds = greatest(0, floor(extract(epoch from (now() - ar.started_at)))::integer),
  score = null,
  max_score = null,
  correct_count = 0,
  question_count = 0,
  metadata = ar.metadata || jsonb_build_object(
    'abandoned', true,
    'reason', 'empty_duplicate_diagnostic_superseded',
    'superseded_at', now()
  )
from ranked_runs rr
where rr.id = ar.id
  and rr.run_rank > 1
  and rr.answered_count = 0;

-- Impede que uma conta mantenha mais de um diagnóstico ativo para o mesmo concurso.
create unique index if not exists assessment_runs_one_open_diagnostic_per_user_idx
  on public.assessment_runs(user_id, exam_id)
  where run_type = 'diagnostico' and finished_at is null;

-- assessment_runs: leitura apenas dos metadados necessários ao próprio usuário.
revoke all on table public.assessment_runs from public, anon, authenticated;
revoke select (id, user_id, exam_id, run_type, title, started_at, finished_at, duration_seconds, score, max_score, correct_count, question_count, metadata),
       insert (id, user_id, exam_id, run_type, title, started_at, finished_at, duration_seconds, score, max_score, correct_count, question_count, metadata),
       update (id, user_id, exam_id, run_type, title, started_at, finished_at, duration_seconds, score, max_score, correct_count, question_count, metadata),
       references (id, user_id, exam_id, run_type, title, started_at, finished_at, duration_seconds, score, max_score, correct_count, question_count, metadata)
on table public.assessment_runs from public, anon, authenticated;

grant select (id, user_id, exam_id, run_type, started_at, finished_at, question_count)
  on table public.assessment_runs to authenticated;
grant insert (user_id, exam_id, run_type, title, question_count, metadata)
  on table public.assessment_runs to authenticated;

-- question_attempts: o cliente pode ler apenas as colunas necessárias e continua sujeito à policy
-- que oculta respostas de avaliações ainda abertas. Toda gravação continua server-side.
revoke all on table public.question_attempts from public, anon, authenticated;
revoke select (id, user_id, question_id, assessment_run_id, selected_option, is_correct, time_spent_seconds, ai_feedback, answered_at),
       insert (id, user_id, question_id, assessment_run_id, selected_option, is_correct, time_spent_seconds, ai_feedback, answered_at),
       update (id, user_id, question_id, assessment_run_id, selected_option, is_correct, time_spent_seconds, ai_feedback, answered_at),
       references (id, user_id, question_id, assessment_run_id, selected_option, is_correct, time_spent_seconds, ai_feedback, answered_at)
on table public.question_attempts from public, anon, authenticated;

grant select (id, user_id, question_id, assessment_run_id, is_correct, time_spent_seconds, answered_at)
  on table public.question_attempts to authenticated;

-- questions: retira a chave e as explicações da superfície pública. O frontend recebe apenas
-- enunciado e alternativas; correção e gabarito permanecem nas Edge Functions server-side.
revoke all on table public.questions from public, anon, authenticated;
revoke select (id, exam_id, exam_subject_id, topic_id, origin, source_document_id, source_question_number, statement, options, correct_option, explanation, difficulty, points, is_verified, is_published, reviewer_notes, created_at),
       insert (id, exam_id, exam_subject_id, topic_id, origin, source_document_id, source_question_number, statement, options, correct_option, explanation, difficulty, points, is_verified, is_published, reviewer_notes, created_at),
       update (id, exam_id, exam_subject_id, topic_id, origin, source_document_id, source_question_number, statement, options, correct_option, explanation, difficulty, points, is_verified, is_published, reviewer_notes, created_at),
       references (id, exam_id, exam_subject_id, topic_id, origin, source_document_id, source_question_number, statement, options, correct_option, explanation, difficulty, points, is_verified, is_published, reviewer_notes, created_at)
on table public.questions from public, anon, authenticated;

grant select (id, exam_id, exam_subject_id, topic_id, origin, statement, options, difficulty, points, is_published)
  on table public.questions to authenticated;

-- As policies de ownership/publicação já existentes permanecem ativas.
