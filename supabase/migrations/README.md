# Histórico de migrações

O schema inicial do SBMG Aprova foi aplicado no projeto Supabase Aprova pela migração sbmg_aprova_phase1 (2026-11-19), seguido de sbmg_aprova_foreign_key_indexes e das migrações complementares de redação, revisões e segurança de progresso das aulas.

O projeto remoto contém 15 tabelas com RLS habilitado, 2 concursos cadastrados, 5 disciplinas, 9 relações concurso-disciplina, 45 tópicos do edital de 2026 e 3 documentos de referência.

A seed inicial de questões autorais está em supabase/seed/diagnostic_questions.sql. Ela é idempotente e só adiciona questões que ainda não existem.

A migração `20261119_lesson_study_sessions_per_lesson.sql` cria `lesson_study_sessions`, com uma linha por sessão, separação entre tópicos e aulas de redação, duração exata em segundos, estado de sessão e RLS por usuário. A migração `20261119_study_plan_goal_tracking.sql` registra a meta em minutos e o instante em que ela é atingida, sem encerrar a sessão automaticamente. A migração `20261119190858_diagnostic_security_and_resume_permissions.sql` limita os grants do banco por coluna, arquiva apenas diagnósticos vazios duplicados, garante uma tentativa ativa por usuário/concurso e mantém as políticas RLS existentes. O arquivo `supabase/sql/diagnostic_security_checks.sql` reúne verificações manuais dos grants e do RLS (não usa pgTAP). Ao fazer alterações futuras, crie novas migrações SQL versionadas; não edite migrações já aplicadas no projeto remoto.


## 2026-11-20 — Security hardening

Migration `20261120115101_security_least_privilege_rls_performance.sql` was applied to the connected Supabase project and committed for traceability. It revokes table/sequence privileges from `anon`, removes duplicate `review_items` policies, optimizes RLS predicates for `lesson_study_sessions`, and adds an index for its `topic_id` foreign key. The application requires authenticated accounts; public anonymous database access is not supported.


## 2026-11-20 — Simulation pools

Migration `20261120121828_simulation_question_pool_versions.sql` adds the A/B/C label and an index for published simulation pools. Migration `20261120123106_require_explicit_simulation_version_and_read.sql` removes the implicit default so new questions must declare their pool, and grants authenticated clients read access only to the version label. The database contains three full 70-question sets; the application rotates per user after completed full simulations.


## 2026-11-20 — Diagnostic result recovery permissions

Migration `20261120130500_diagnostic_results_read_grants.sql` restores authenticated SELECT access to `assessment_runs` and `question_attempts` (and the required INSERT/UPDATE privileges) for the diagnostic recovery UI. Existing RLS policies continue to restrict records to the authenticated user's own data.


## 2026-11-20 — Progresso das aulas por tópico

Migration `20261120230000_topic_lesson_learning_state.sql` adds the `lesson_state` JSONB column to `topic_progress`. It stores understood lesson sections, opened recall references, and challenge visibility for each user/topic. Existing per-user RLS policies remain in place.
