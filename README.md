# Aprova — SBMG Aprova

Aplicação de preparação para o Concurso para Emprego Público nº 001/2026 da Terminais Aéreos de Maringá (SBMG), cargo **Auxiliar Administrativo/Financeiro**.

## Publicação
Site: **https://1959414-5.github.io/Aprova/**

Deploy automático pelo GitHub Actions a cada push em `main`. Configuração: [docs/GITHUB-PAGES.md](docs/GITHUB-PAGES.md).

## Stack
- React + Vite
- Supabase Auth e Postgres
- Supabase Edge Functions para correção de respostas e Professor IA
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
- No simulado, o gabarito fica oculto durante a execução; a nota ponderada e o gabarito comentado são liberados apenas após finalizar.

## Supabase
Projeto: `ehsrjjflwrmmegfvupch`. O schema original tem 15 tabelas com RLS habilitado. Tabelas adicionais:
- `topic_lessons`: leitura autenticada de aulas publicadas.
- `topic_progress`: progresso isolado por usuário.
- `ai_tutor_usage`: controle privado de chamadas do tutor.

Edge Functions:
- `answer-question`: registra a resposta; só revela correção imediata no diagnóstico/prática.
- `finish-assessment`: calcula a nota e libera gabarito somente após a finalização.
- `study-tutor`: tutor contextualizado pelo tópico selecionado.

SQLs versionados em `supabase/sql/`.

## Ativar o Professor IA
A função está implantada, mas precisa da chave da OpenAI no secret `OPENAI_API_KEY` do Supabase. Siga [docs/PROFESSOR-IA.md](docs/PROFESSOR-IA.md). A chave não deve ficar em `.env`, VITE, GitHub ou no navegador. O faturamento da API é separado da assinatura ChatGPT.

## Segurança
O repositório é público. Não inclua service-role/secret key, chaves de provedores de IA ou gabaritos nas fontes versionadas. A publishable key é apropriada para o frontend com RLS habilitado.

## Fontes
- Edital nº 001/2026 — Anexos II e III.
- Caderno histórico SBMG 2019 — Auxiliar Administrativo: [prova](https://arquivos.qconcursos.com/prova/arquivo_prova/80482/fauel-2019-sbmg-pr-auxiliar-administrativo-prova.pdf) e [gabarito](https://arquivos.qconcursos.com/prova/arquivo_gabarito/80482/fauel-2019-sbmg-pr-auxiliar-administrativo-gabarito.pdf).

**Importante:** questões autorais não são itens oficiais do caderno de 2019 nem da prova de 2026.
