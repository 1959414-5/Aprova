# Arquitetura técnica

## Aplicação
- Vite 8 e React 19.
- Supabase JS usa somente URL do projeto e publishable key no navegador.
- Autenticação por e-mail e senha.

## Banco
- Catálogo compartilhado: exams, subjects, exam_subjects, topics, source_documents, questions e flashcards.
- Dados individuais: study_profiles, assessment_runs, question_attempts, study_plan_items, study_sessions, review_items, essay_submissions e flashcard_reviews.
- RLS está habilitado nas 15 tabelas públicas.
- Registros de estudo são isolados por auth.uid() = user_id.

## Gabarito
O navegador pode ler somente enunciados e alternativas da tabela questions. Não recebe permissão para correct_option, explanation ou reviewer_notes.

A Edge Function answer-question exige usuário autenticado. Após validar a sessão, consulta o gabarito no servidor, grava a tentativa no contexto RLS do candidato e retorna a correção daquela resposta. Nenhuma chave secret/service-role deve entrar no Vite, no GitHub ou no navegador.

## Variáveis locais
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

## Próximos módulos
1. Professor IA ligado à API de modelo por função server-side.
2. Correção formativa de redação pelos quatro critérios do edital.
3. Banco histórico da prova SBMG 2019, após transcrição e conferência.
4. Simulados completos com montagem ponderada e relatório por assunto.
5. Revisão espaçada e flashcards.

Não desabilitar RLS. Novas tabelas em public precisam de RLS e políticas específicas antes de conceder acesso à Data API.
