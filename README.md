# Aprova — SBMG Aprova

Aplicação de preparação para o Concurso para Emprego Público nº 001/2026 da Terminais Aéreos de Maringá (SBMG), cargo **Auxiliar Administrativo/Financeiro**.

## Publicação
Site: **https://1959414-5.github.io/Aprova/**

Deploy automático pelo GitHub Actions a cada push em `main`. Configuração: [docs/GITHUB-PAGES.md](docs/GITHUB-PAGES.md).

## Stack
- React + Vite
- Supabase Auth e Postgres
- Supabase Edge Functions para correção, tutor e redação
- OpenAI Responses API, com chave armazenada somente nos Secrets do Supabase

## Executar localmente
1. Instale Node.js 22.
2. Copie `.env.example` para `.env.local`.
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Execute `npm install` e `npm run dev`.

## Conteúdo e preparação
- 5 disciplinas e 45 tópicos correspondentes ao Anexo III.
- 45 aulas autorais com objetivos, explicações, exemplos resolvidos, resumos, erros comuns e exercícios de fixação: `content/lessons.json`.
- Progresso do tópico separado do tempo efetivamente estudado; sessões cronometradas só são salvas quando o candidato finaliza.
- Diagnóstico curto com 22 questões, distribuídas proporcionalmente.
- Simulado completo com 70 questões e os pesos exatos da prova objetiva: 10/10/10/10/30 questões e 100 pontos.
- Banco inicial de 70 questões autorais, todas identificadas como geradas para treino e pendentes de revisão humana.
- No simulado, o gabarito fica oculto durante a execução; a nota ponderada e o gabarito comentado são liberados após finalizar.
- Curso de Redação guiado por seis aulas autorais: fundamentos do texto dissertativo-argumentativo, estrutura, tema e tese, argumentação, coesão/linguagem e conclusão/revisão.
- Cada aula inclui explicação, exemplos comentados e exercício com resposta explicada; a plataforma salva as respostas e aulas concluídas por usuário em `essay_learning_progress`.
- Área de prática com exercícios, análise de redação-modelo autoral, explicação da rubrica do edital e Laboratório de Redação com temas, rascunhos, contador de 20–30 linhas e correção formativa por quatro critérios.
- Revisões e flashcards: um cartão inicial por tópico, com intervalos de 1, 2, 4, 7 e 15 dias.

## Supabase
Projeto: `ehsrjjflwrmmegfvupch`. O schema original tem RLS habilitado. Tabelas e estruturas adicionais:
- `topic_lessons`: leitura autenticada de aulas publicadas.
- `topic_progress`: progresso isolado por usuário.
- `lesson_study_sessions`: sessões independentes por tópico/aula de redação, com duração exata em segundos, meta do Plano Flexível e registro de meta atingida, protegidas por RLS.
- `ai_tutor_usage`: controle privado de consumo de IA, separado por tipo de solicitação.

Edge Functions:
- `answer-question`: registra resposta; correção imediata somente no diagnóstico/prática.
- `finish-assessment`: calcula a nota e libera gabarito somente após a finalização.
- `study-tutor`: tutor contextualizado pelo tópico selecionado.
- `essay-feedback`: correção formativa de redação com rubrica estruturada.

SQLs versionados em `supabase/sql/`.

## Ativar e pagar o Professor IA
A chave `OPENAI_API_KEY` deve existir em Supabase → Edge Functions → Secrets. A chave nunca deve ficar em `.env`, variáveis `VITE_*`, GitHub ou navegador.

A API da OpenAI é faturada separadamente da assinatura ChatGPT. Novas contas usam faturamento pré-pago; a compra inicial mínima é de US$ 5. Durante a configuração, confira e desative a recarga automática se preferir comprar créditos manualmente. Consulte [a orientação de faturamento pré-pago](https://help.openai.com/pt-br/articles/8264644-setting-up-and-managing-prepaid-api-billing).

O modelo padrão no servidor é `gpt-6.2-sol`. O limite é de até 35 perguntas/dia por conta no tutor e 35 solicitações/dia por conta na correção de redações. As cotas são separadas; os limites internos não representam o saldo da conta OpenAI.

Mais detalhes: [docs/PROFESSOR-IA.md](docs/PROFESSOR-IA.md).

## Plano Flexível
O candidato escolhe blocos de 15, 40 ou 90 minutos. A escolha fica salva no navegador e é copiada para cada sessão. O cronômetro faz contagem regressiva, registra o marco de meta atingida e continua em tempo excedido até o usuário salvar ou cancelar. O aviso interno sempre funciona; notificações do navegador são opcionais e dependem de permissão concedida pelo usuário.

## Diagnóstico inicial
O diagnóstico tem 22 questões (3 de cada disciplina geral e 10 específicas). A sequência selecionada fica em `assessment_runs.metadata.question_ids`; ao recarregar, `diagnostic-session` recupera as respostas e a próxima questão pendente. O gabarito e as explicações de correção permanecem no servidor. Uma única tentativa diagnóstica ativa por usuário/concurso é garantida por índice único parcial e RLS.

## Segurança
O repositório é público. Não inclua service-role/secret key, chaves de provedores de IA, credenciais ou gabaritos nas fontes versionadas. A publishable key é apropriada para o frontend com RLS habilitado.

## Fontes
- Edital nº 001/2026 — Anexos II e III.
- Caderno histórico SBMG 2019 — Auxiliar Administrativo: [prova](https://arquivos.qconcursos.com/prova/arquivo_prova/80482/fauel-2019-sbmg-pr-auxiliar-administrativo-prova.pdf) e [gabarito](https://arquivos.qconcursos.com/prova/arquivo_gabarito/80482/fauel-2019-sbmg-pr-auxiliar-administrativo-gabarito.pdf).

**Importante:** as 70 questões atuais e os temas de redação são autorais. Não são itens oficiais do caderno de 2019 nem da prova de 2026; precisam de revisão humana independente.
