# Arquitetura técnica

## Frontend
- React + Vite; deploy estático pelo GitHub Pages.
- Supabase JS usa somente URL e publishable key no navegador.
- Auth por e-mail/senha; tema light/dark persistente.
- Professor IA chama apenas a Edge Function `study-tutor`, nunca a OpenAI diretamente.

## Banco
- Catálogo: `exams`, `subjects`, `exam_subjects`, `topics`, `source_documents`, `questions`, `flashcards`.
- Dados pessoais: `study_profiles`, `assessment_runs`, `question_attempts`, `study_plan_items`, `study_sessions`, `review_items`, `essay_submissions`, `flashcard_reviews`.
- Aulas compartilhadas: `topic_lessons`.
- Progresso individual por tópico: `topic_progress`.
- Uso privado do tutor: `ai_tutor_usage`.

## Banco de questões
Distribuição de 70 questões segundo o Anexo IV:
- Língua Portuguesa: 10 questões / 10 pontos.
- Matemática e Raciocínio Lógico: 10 / 10.
- Informática: 10 / 10.
- Conhecimentos Gerais e Atualidades: 10 / 10.
- Conhecimentos Específicos: 30 / 60.

As 70 questões atualmente carregadas são autorais. Todas têm `is_verified=false`; nenhuma foi aprovada por revisão humana independente. Não são itens oficiais de 2019 ou da prova de 2026.

## Conteúdo didático
Cada aula publicada em `topic_lessons` contém introdução, objetivos, seções explicativas, exemplo resolvido, resumo, erros comuns e atividade. O fonte editável está em `content/lessons.json`. Base: Anexo III do Edital nº 001/2026; exemplos específicos também usam atribuições do cargo 061 no Anexo II.

## Tempo e progresso
`topic_progress` controla `em_andamento`, `concluido` e `revisar`. `study_sessions` registra somente sessões salvas pelo candidato depois do cronômetro. Abrir tópico ou cancelar sessão não conta tempo.

## Diagnóstico e simulados
- Diagnóstico: amostra curta de 22 questões, com 3 de cada disciplina geral e 10 específicas; permite correção comentada após cada resposta.
- Simulado: exatamente 70 questões, distribuição oficial e pesos de 100 pontos; esconde o gabarito durante a execução.
- `answer-question` valida o usuário e registra resposta via cliente privilegiado de servidor.
- `finish-assessment` calcula nota ponderada no servidor, fecha a avaliação e só então libera revisão com gabarito e explicações.
- Usuários não têm INSERT/UPDATE/DELETE direto em `question_attempts`, nem UPDATE/DELETE direto em `assessment_runs`. SELECT de tentativas de uma avaliação só é permitido depois que ela está encerrada.

## Professor IA
A Edge Function `study-tutor`:
- JWT obrigatório.
- Aula publicada e tópico carregados do banco.
- Texto e histórico limitados.
- Responses API com `store=false`.
- Secret `OPENAI_API_KEY` somente no Supabase.
- Limite inicial de 35 perguntas/dia/usuário, registrado em `ai_tutor_usage`.

## RLS
- `topic_lessons`: authenticated SELECT somente para publicadas.
- `topic_progress`: CRUD por `auth.uid()=user_id`.
- `ai_tutor_usage`: sem acesso direto a anon/authenticated; a Edge Function usa contexto administrativo.
- `assessment_runs`: leitura e criação própria; finalização pelo servidor.
- `question_attempts`: leitura própria apenas para questões fora de avaliação ou após encerramento; gravação por Edge Function.
- As 15 tabelas originais também têm RLS habilitado.

## Próximos módulos
Revisão humana das questões; banco histórico 2019; Laboratório de Redação; revisões espaçadas e flashcards; refinamento do Professor IA.
