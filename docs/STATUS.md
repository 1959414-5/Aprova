# Estado do projeto — 19/11/2026

## Implementado
- App React/Vite publicado no GitHub Pages, tema claro/escuro e layout responsivo.
- Supabase Auth e perfil individual.
- Painel, 5 disciplinas e 45 tópicos do Anexo III.
- 45 aulas autorais com objetivos, explicações, exemplos, resumos, erros comuns e prática.
- `topic_progress` separa conclusão do tópico de tempo efetivo de estudo.
- Sessões cronometradas: tempo só é salvo ao finalizar uma sessão.
- Diagnóstico inicial com 22 questões autorais, não oficiais e pendentes de revisão humana.
- Edge Function `answer-question` autenticada; gabarito protegido.
- Edge Function `study-tutor` implantada e autenticada, com limite de 35 chamadas/dia/conta e chave lida somente em secret server-side.
- UI do Professor IA ligada à Edge Function.

## Supabase remoto
- Project ref: `ehsrjjflwrmmegfvupch`.
- 45 aulas publicadas para 45 tópicos.
- `topic_lessons`, `topic_progress` e `ai_tutor_usage` com RLS e privilégios explícitos.
- Conta de teste: perfil preservado; 0 sessões, 0 tentativas, 0 diagnósticos vazios.
- Banco inicial: 22 questões autorais, `is_verified=false` até revisão humana.

## Para ativar o Professor IA
Adicionar `OPENAI_API_KEY` em Supabase → Edge Functions → Secrets. Opcionalmente configurar `OPENAI_MODEL`. Consultar `docs/PROFESSOR-IA.md`. A chave não deve ficar no GitHub ou navegador. O faturamento da API é separado da assinatura ChatGPT.

## Ainda pendente
1. Teste real das aulas e sessões no navegador.
2. Ativar e testar Professor IA após adicionar a chave.
3. Ampliar/revisar o banco e importar prova de 2019 separadamente.
4. Simulado completo de 70 questões com distribuição oficial.
5. Laboratório de redação com os quatro critérios do edital.
6. Revisão espaçada e flashcards.
7. Habilitar Leaked Password Protection no Supabase Auth.

## Segurança
O repositório é público. Não versionar secrets, gabaritos ou credenciais. A chave publishable é usada no cliente com RLS; chaves secret/service-role e OpenAI ficam no servidor. As 22 questões autorais não foram verificadas por revisão humana.
