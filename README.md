# Aprova — SBMG Aprova

Aplicação de preparação para o Concurso para Emprego Público nº 001/2026 da Terminais Aéreos de Maringá (SBMG), cargo **Auxiliar Administrativo/Financeiro**.

## Publicação
Site: **https://1959414-5.github.io/Aprova/**

Deploy automático pelo GitHub Actions a cada push em `main`. Configuração: [docs/GITHUB-PAGES.md](docs/GITHUB-PAGES.md).

## Stack
- React + Vite
- Supabase Auth e Postgres
- Supabase Edge Functions para correção protegida e Professor IA
- OpenAI Responses API (chave armazenada somente nos Secrets do Supabase)

## Executar localmente
1. Instale Node.js 22.
2. Copie `.env.example` para `.env.local`.
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Execute `npm install` e `npm run dev`.

## Conteúdo e preparação
- 5 disciplinas e 45 tópicos correspondentes ao Anexo III.
- 45 aulas autorais estruturadas com objetivos, explicações, exemplos resolvidos, resumos, erros comuns e exercícios de fixação: `content/lessons.json`.
- Progresso de tópico separado do tempo efetivo de estudo.
- Sessões cronometradas: o tempo é persistido somente quando o candidato salva.
- Diagnóstico inicial com 22 questões autorais, identificadas como conteúdo não oficial e pendentes de revisão humana.
- Professor IA contextualizado pelo tópico e pela aula selecionada; limite inicial de 35 solicitações por usuário/dia.

## Supabase
Projeto: `ehsrjjflwrmmegfvupch`. O schema original tem 15 tabelas com RLS habilitado. Foram adicionadas:
- `topic_lessons`: leitura autenticada de aulas publicadas.
- `topic_progress`: progresso isolado por usuário.
- `ai_tutor_usage`: controle privado de chamadas do Professor IA.

SQLs: `supabase/sql/`.

Edge Functions:
- `answer-question`: corrige respostas no servidor sem expor o gabarito.
- `study-tutor`: chama a Responses API do servidor, usando `OPENAI_API_KEY`.

## Ativar o Professor IA
O código e a função já estão implantados, mas a função retorna “não configurado” até que a chave da API seja adicionada aos Secrets do Supabase. Siga [docs/PROFESSOR-IA.md](docs/PROFESSOR-IA.md).

**Não coloque a chave em arquivos `.env` versionados, em variáveis `VITE_*`, no GitHub ou no chat.** A chave deve ficar apenas no secret `OPENAI_API_KEY` do Supabase. O uso da API é faturado separadamente da assinatura ChatGPT.

## Segurança
O repositório é público. Não inclua service-role/secret key, chaves de provedores de IA ou gabaritos nas fontes versionadas. A publishable key é apropriada ao frontend com RLS habilitado.

## Fontes
- Edital nº 001/2026 — Anexos II e III.
- Caderno histórico SBMG 2019 — Auxiliar Administrativo: [prova](https://arquivos.qconcursos.com/prova/arquivo_prova/80482/fauel-2019-sbmg-pr-auxiliar-administrativo-prova.pdf) e [gabarito](https://arquivos.qconcursos.com/prova/arquivo_gabarito/80482/fauel-2019-sbmg-pr-auxiliar-administrativo-gabarito.pdf).

**Importante:** questões autorais não são itens oficiais do caderno de 2019 nem da prova de 2026.
