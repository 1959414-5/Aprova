# Aprova — SBMG Aprova

Aplicação de preparação para o Concurso para Emprego Público nº 001/2026 da Terminais Aéreos de Maringá (SBMG), cargo **Auxiliar Administrativo/Financeiro**.

## Publicação
Site: **https://1959414-5.github.io/Aprova/**

Deploy automático pelo GitHub Actions a cada push em `main`. Configuração e diagnóstico: [docs/GITHUB-PAGES.md](docs/GITHUB-PAGES.md).

## Stack
- React + Vite
- Supabase Auth e Postgres
- Supabase Edge Function para correção de respostas sem expor o gabarito no navegador

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

## Supabase
Projeto: `ehsrjjflwrmmegfvupch`. O schema original tem 15 tabelas com RLS habilitado. Foram adicionadas `topic_lessons` (somente leitura autenticada de aulas publicadas) e `topic_progress` (dados isolados por usuário). SQL correspondente: `supabase/sql/lessons-and-topic-progress.sql`.

A Edge Function `answer-question` exige autenticação, consulta o gabarito somente no servidor e registra a tentativa.

## Segurança
O repositório é público. Não inclua service-role/secret key, chaves de provedores de IA ou gabaritos nas fontes versionadas. A publishable key é apropriada ao frontend com RLS habilitado.

## Fontes
- Edital nº 001/2026 — Anexos II e III.
- Caderno histórico SBMG 2019 — Auxiliar Administrativo: [prova](https://arquivos.qconcursos.com/prova/arquivo_prova/80482/fauel-2019-sbmg-pr-auxiliar-administrativo-prova.pdf) e [gabarito](https://arquivos.qconcursos.com/prova/arquivo_gabarito/80482/fauel-2019-sbmg-pr-auxiliar-administrativo-gabarito.pdf).

**Importante:** questões autorais não são itens oficiais do caderno de 2019 nem da prova de 2026.
