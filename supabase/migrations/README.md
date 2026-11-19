# Histórico de migrações

O schema inicial do SBMG Aprova foi aplicado no projeto Supabase Aprova pela migração sbmg_aprova_phase1 (2026-11-19), seguido de sbmg_aprova_foreign_key_indexes e das migrações complementares de redação, revisões e segurança de progresso das aulas.

O projeto remoto contém 15 tabelas com RLS habilitado, 2 concursos cadastrados, 5 disciplinas, 9 relações concurso-disciplina, 45 tópicos do edital de 2026 e 3 documentos de referência.

A seed inicial de questões autorais está em supabase/seed/diagnostic_questions.sql. Ela é idempotente e só adiciona questões que ainda não existem.

Ao fazer alterações futuras, crie novas migrações SQL versionadas; não edite migrações já aplicadas no projeto remoto.
