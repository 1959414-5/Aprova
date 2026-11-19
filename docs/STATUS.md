# Estado do projeto — 19/11/2026

## Implementado e publicado em código
- App React/Vite, tema claro/escuro e layout responsivo.
- Supabase Auth e perfil individual.
- Painel, 5 disciplinas e 45 tópicos do Anexo III.
- 45 aulas autorais com explicações, exemplos, resumos, erros comuns e prática.
- Progresso de tópico separado do tempo de estudo; sessões cronometradas só são salvas ao finalizar.
- Diagnóstico inicial com 22 questões proporcionais; sequência persistida no registro da tentativa e retomada autenticada após atualizar/reabrir o navegador.
- Simulado de 70 questões, distribuição oficial e nota ponderada server-side.
- Gabarito oculto durante simulado.
- Professor IA contextualizado pela aula; Edge Function autenticada `study-tutor`.
- Curso de Redação: seis aulas autorais em quatro etapas (Aprender, Praticar, Analisar e Escrever), com exercícios objetivos e explicação, texto-modelo comentado e rubrica do edital.
- `assessment_runs`: tentativas diagnósticas com uma sessão ativa por usuário/concurso, sequência de questões em `metadata.question_ids` e retomada autenticada por `diagnostic-session`.
- `essay_learning_progress`: progresso individual por aula (`nao_iniciada`, `em_andamento`, `concluida`), respostas de exercícios e datas de início/conclusão, com RLS.
- Abertura/visualização não altera progresso; iniciar exige confirmação; conclusão também exige confirmação. Cada sessão é vinculada ao tópico ou à aula de redação e registra início, término e duração em segundos. Sessões salvas não concluem automaticamente o conteúdo; é possível retomar a aula.
- Laboratório de Redação preservado: temas, salvamento de rascunho, contador de 20–30 linhas e correção formativa por quatro critérios, via `essay-feedback`.
- Revisões e flashcards: 45 cartões iniciais e agendamento de 1, 2, 4, 7 e 15 dias.

- O curso trabalha o gênero dissertativo-argumentativo sobre questões da atualidade e explicita os limites de 20–30 linhas e os quatro critérios de 25 pontos do edital. Conteúdo e questões de aula são autorais/didáticos, não provas oficiais.

## Banco remoto
- Supabase project ref: `ehsrjjflwrmmegfvupch`.
- 45 aulas publicadas.
- 70 questões autorais: 10/10/10/10/30. Todas com `is_verified=false`.
- 45 flashcards publicados, um por tópico.
- `ai_tutor_usage` separa consumo do tutor e correção de redação.
- `essay_submissions` possui proteção para usuário editar apenas rascunhos; pontuações são atualizadas pelo servidor.
- Quatro tentativas diagnósticas vazias duplicadas foram encerradas como abandonadas, sem excluir respostas. Uma única tentativa vazia foi preservada; na primeira retomada após o deploy, `diagnostic-session` gravará a sequência de 22 questões e recuperará as respostas que existirem.

## Integração de IA
- `OPENAI_API_KEY` deve ficar em Supabase → Edge Functions → Secrets.
- Modelo padrão: `gpt-6.2-sol`.
- Funções ativas: `study-tutor`, `essay-feedback`, `answer-question`, `finish-assessment`, `diagnostic-session` (todas autenticadas com JWT).
- Tutor e correção de redação têm limites de 35 solicitações/dia/usuário cada.
- Cobrança da OpenAI API é separada da assinatura ChatGPT. Conta pré-paga nova pode exigir compra mínima de US$ 5; confira/desative recarga automática.

## Pendências antes do uso efetivo
1. Build/deploy e teste visual das telas Redação e Revisões.
2. Testar Professor IA e correção de redação com saldo e sessão autenticada.
3. Revisar humanamente as 70 questões autorais e seus gabaritos.
4. Testar diagnóstico e simulado ponta a ponta com a conta autenticada do candidato (o teste de navegador com a sessão real ainda precisa ser feito).
5. Importar e conferir separadamente as questões históricas oficiais de 2019.
6. Habilitar Leaked Password Protection no Supabase Auth.

## Segurança
O repositório é público. Não versionar secrets, chaves, credenciais ou gabaritos. O navegador usa publishable key com RLS; chaves de serviço e OpenAI ficam no servidor.
