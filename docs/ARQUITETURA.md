# Arquitetura técnica

## Frontend
- React + Vite; deploy estático pelo GitHub Pages.
- Supabase JS usa somente URL e publishable key no navegador.
- Auth por e-mail/senha.
- Tema light/dark com preferência persistida no navegador.
- Professor IA usa `supabase.functions.invoke("study-tutor")`; nenhuma chamada à OpenAI é feita diretamente pelo navegador.

## Banco
- Catálogo: `exams`, `subjects`, `exam_subjects`, `topics`, `source_documents`, `questions`, `flashcards`.
- Dados pessoais: `study_profiles`, `assessment_runs`, `question_attempts`, `study_plan_items`, `study_sessions`, `review_items`, `essay_submissions`, `flashcard_reviews`.
- Aulas compartilhadas: `topic_lessons`.
- Progresso individual por tópico: `topic_progress`.
- Uso privado do tutor: `ai_tutor_usage` (RLS, sem acesso direto das roles anon/authenticated).

## Conteúdo didático
Cada aula publicada em `topic_lessons` usa JSON:
- introduction
- objectives[]
- sections[{heading,text}]
- worked_example{prompt,steps[],result}
- summary[]
- common_mistakes[]
- practice

O fonte editável está em `content/lessons.json`. Base: Anexo III do Edital nº 001/2026. Exemplos específicos usam o Anexo II.

## Tempo e progresso
`topic_progress` controla `em_andamento`, `concluido` e `revisar`. `study_sessions` registra somente sessões salvas pelo candidato após o cronômetro. Abrir um tópico ou cancelar a sessão não conta tempo nem conclusão.

## Professor IA
A Edge Function `study-tutor`:
- Exige JWT válido (`verify_jwt=true`).
- Busca apenas a aula publicada e os metadados do tópico.
- Limita texto e histórico recente.
- Usa Responses API com `store=false`.
- Lê `OPENAI_API_KEY` e, opcionalmente, `OPENAI_MODEL` apenas no servidor.
- Limita cada usuário a 35 solicitações por dia, controladas em `ai_tutor_usage`.

## Segurança do gabarito
O navegador pode ler enunciados e alternativas, mas não `correct_option` ou `explanation`. `answer-question` consulta o gabarito no servidor e registra a tentativa. Nunca colocar secrets em variáveis VITE_.

## RLS
`topic_lessons`: SELECT para authenticated somente quando `is_published=true`; anon sem leitura.
`topic_progress`: CRUD para authenticated com `auth.uid()=user_id`.
`ai_tutor_usage`: sem privilégios de acesso direto a anon/authenticated; somente a Edge Function administrativa registra e consulta os limites.
As 15 tabelas originais também têm RLS habilitado.

## Próximos módulos
Simulados completos de 70 questões; laboratório de redação; banco histórico de questões; revisões e flashcards.
