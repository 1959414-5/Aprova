# Estado do projeto — 19/11/2026

## Implementado
- App React/Vite publicado no GitHub Pages, tema claro/escuro e layout responsivo.
- Supabase Auth e perfil individual.
- Painel, 5 disciplinas e 45 tópicos do Anexo III.
- 45 aulas autorais com explicações, exemplos, resumos, erros comuns e prática.
- Progresso do tópico separado do tempo de estudo; sessões cronometradas são salvas apenas ao finalizar.
- Diagnóstico curto com 22 questões proporcionais.
- Simulado completo de 70 questões com distribuição e pesos oficiais.
- Respostas de simulado sem gabarito até a finalização.
- Nota ponderada e gabarito comentado calculados no servidor por `finish-assessment`.
- Professor IA em interface contextualizada pela aula e Edge Function autenticada `study-tutor`.
- Correção protegida via `answer-question`.

## Banco remoto
- Supabase project ref: `ehsrjjflwrmmegfvupch`.
- 45 aulas publicadas para 45 tópicos.
- 70 questões autorais: 10/10/10/10/30, somando 100 pontos.
- Todas as 70 questões estão com `is_verified=false`; aguardam revisão humana.
- A conta de teste mantém o perfil e está sem sessões, tentativas, simulados ou progresso registrados.

## Para ativar o Professor IA
Adicionar `OPENAI_API_KEY` em Supabase → Edge Functions → Secrets. Opcionalmente definir `OPENAI_MODEL`. Seguir `docs/PROFESSOR-IA.md`. O uso da API tem cobrança separada da assinatura ChatGPT.

## Pendências antes do uso efetivo
1. Revisar qualidade e gabaritos das 70 questões autorais.
2. Ativar/testar Professor IA após configurar a chave da API.
3. Testar o simulado completo ponta a ponta com uma conta de teste, não a conta do candidato.
4. Importar e conferir separadamente as questões oficiais/históricas de 2019.
5. Laboratório de redação com os quatro critérios do edital.
6. Revisões espaçadas e flashcards.
7. Habilitar Leaked Password Protection no Supabase Auth.

## Segurança
O repositório é público. Não versionar secrets, gabaritos ou credenciais. As Edge Functions usam secrets no servidor e o navegador usa apenas a publishable key com RLS. Nenhuma das questões autorais foi aprovada por revisão humana independente.
