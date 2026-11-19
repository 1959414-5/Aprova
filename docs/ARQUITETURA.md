# Arquitetura técnica

## Frontend
- React + Vite; deploy estático pelo GitHub Pages.
- Supabase JS usa somente URL e publishable key no navegador.
- Auth por e-mail/senha.
- Tema light/dark com preferência persistida no navegador.

## Banco
- Catálogo: `exams`, `subjects`, `exam_subjects`, `topics`, `source_documents`, `questions`, `flashcards`.
- Dados pessoais: `study_profiles`, `assessment_runs`, `question_attempts`, `study_plan_items`, `study_sessions`, `review_items`, `essay_submissions`, `flashcard_reviews`.
- Aulas compartilhadas: `topic_lessons`.
- Progresso individual por tópico: `topic_progress`.

## Conteúdo didático
Cada aula publicada em `topic_lessons` usa JSON:
- introduction
- objectives[]
- sections[{heading,text}]
- worked_example{prompt,steps[],result}
- summary[]
- common_mistakes[]
- practice

O fonte editável está em `content/lessons.json`. Base: Anexo III do Edital nº 001/2026. Exemplos de rotinas específicas também usam as atribuições do cargo 061 no Anexo II.

## Tempo e progresso
`topic_progress` controla `em_andamento`, `concluido` e `revisar`. `study_sessions` registra somente sessões salvas pelo candidato, após o cronômetro. Abrir um tópico ou cancelar a sessão não conta tempo nem conclusão.

## Segurança do gabarito
O navegador pode ler enunciados e alternativas da tabela `questions`, mas não `correct_option` ou `explanation`. A Edge Function `answer-question` exige usuário autenticado, consulta gabarito no servidor e registra a tentativa. Não levar secrets para variáveis VITE_.

## RLS
`topic_lessons`: SELECT para authenticated somente quando `is_published=true`; anon sem leitura.
`topic_progress`: CRUD para authenticated com `auth.uid()=user_id` em policies.
As demais 15 tabelas originais também têm RLS habilitado.

## Próximos módulos
Professor IA por Edge Function com segredo do provedor armazenado no Supabase; simulados completos de 70 questões; redação; banco histórico de questões; revisões e flashcards.
