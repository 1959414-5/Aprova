# Arquitetura técnica

## Frontend
- React + Vite; deploy estático pelo GitHub Pages.
- Supabase JS usa somente URL e publishable key no navegador.
- Auth por e-mail/senha; tema claro/escuro persistente.
- Professor IA e corretor de redação chamam Edge Functions; nenhuma chave OpenAI é enviada ao navegador.

## Banco
- Catálogo: `exams`, `subjects`, `exam_subjects`, `topics`, `source_documents`, `questions`, `flashcards`.
- Dados pessoais: `study_profiles`, `assessment_runs`, `question_attempts`, `study_plan_items`, `study_sessions`, `review_items`, `essay_submissions`, `flashcard_reviews`.
- Aulas compartilhadas: `topic_lessons`.
- Progresso individual por tópico: `topic_progress`.
- Uso de IA: `ai_tutor_usage`, separado por `request_type=tutor|essay`, sem acesso direto do navegador.

## Banco de questões
Distribuição de 70 questões segundo o edital:
- Língua Portuguesa: 10 questões / 10 pontos.
- Matemática e Raciocínio Lógico: 10 / 10.
- Informática: 10 / 10.
- Conhecimentos Gerais e Atualidades: 10 / 10.
- Conhecimentos Específicos: 30 / 60.

As 70 questões carregadas são autorais. Todas têm `is_verified=false`; nenhuma foi aprovada por revisão humana independente. Não são itens oficiais de 2019 nem da prova de 2026.

## Conteúdo didático
Cada aula publicada em `topic_lessons` contém introdução, objetivos, seções explicativas, exemplo resolvido, resumo, erros comuns e atividade. O fonte editável está em `content/lessons.json`. Base: Anexo III do Edital nº 001/2026; exemplos específicos usam atribuições do cargo 061 no Anexo II.

## Tempo e progresso
`topic_progress` controla `em_andamento`, `concluido` e `revisar`. `study_sessions` registra somente sessões salvas pelo candidato depois do cronômetro. Abrir tópico ou cancelar sessão não conta tempo.

## Diagnóstico e simulados
- Diagnóstico: 22 questões, com 3 de cada disciplina geral e 10 específicas; correção comentada depois de cada resposta.
- Simulado: 70 questões, distribuição oficial e pesos de 100 pontos; gabarito oculto durante a execução.
- `answer-question` valida o usuário e registra resposta no servidor.
- `finish-assessment` calcula nota ponderada no servidor e libera revisão comentada apenas após finalização.
- Usuários não têm INSERT/UPDATE/DELETE direto em `question_attempts`, nem UPDATE/DELETE direto em `assessment_runs`.

## Professor IA
A Edge Function `study-tutor`:
- JWT obrigatório e tópico/aula publicados buscados no Supabase.
- Texto e histórico limitados; Responses API com `store=false`.
- Secret `OPENAI_API_KEY` somente no Supabase.
- Modelo padrão: `gpt-6.2-sol`.
- Limite de 35 perguntas/dia/usuário, separado da cota de redação.

## Laboratório de Redação
- Usuário cria e altera somente rascunhos próprios.
- A função `essay-feedback` exige JWT, valida 20–30 linhas digitadas, usa quatro critérios de até 25 pontos e grava a correção via contexto administrativo.
- Uma redação corrigida não pode ser submetida novamente; nova tentativa requer outro rascunho.
- A devolutiva da IA é formativa, não substitui a nota oficial da banca.
- O contador de linhas considera quebras de linha manuais; não simula perfeitamente linhas manuscritas.

## Revisões e flashcards
- Um cartão inicial por cada um dos 45 tópicos.
- Resposta revelada apenas após tentativa de recuperação ativa.
- Autoavaliação de 1 a 5 agenda o próximo contato em 1, 2, 4, 7 ou 15 dias.
- Histórico de revisão é individual, append-only e protegido por RLS.

## RLS
- `topic_lessons`: authenticated SELECT somente para aulas publicadas.
- `topic_progress`: CRUD por `auth.uid()=user_id`.
- `ai_tutor_usage`: sem acesso direto a anon/authenticated.
- `assessment_runs`: leitura e criação próprias; finalização pelo servidor.
- `question_attempts`: leitura própria apenas fora de avaliação ou após encerramento; gravação via Edge Function.
- `essay_submissions`: leitura própria; INSERT e atualização de rascunhos em colunas permitidas; correção pelo servidor.
- `flashcards`: leitura autenticada apenas dos cartões publicados.
- `flashcard_reviews`: leitura e INSERT próprios.
