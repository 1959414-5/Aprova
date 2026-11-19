# Estado do projeto — 19/11/2026

## Implementado
- App React/Vite publicado no GitHub Pages, com tema claro/escuro e layout responsivo.
- Supabase Auth e perfil individual; dados do candidato isolados por RLS.
- Painel, 5 disciplinas e 45 tópicos do Anexo III.
- 45 aulas autorais em `topic_lessons`, também versionadas em `content/lessons.json`.
- Aulas com objetivos, explicação, exemplo resolvido, resumo, erros comuns e prática.
- `topic_progress` separa conclusão do tópico de tempo de estudo.
- Sessões cronometradas não são gravadas por cliques na lista; tempo só é salvo ao finalizar.
- Diagnóstico inicial com 22 questões autorais. Gabarito protegido e questões marcadas pendentes de revisão humana.
- Edge Function `answer-question` exige autenticação e corrige no servidor.

## Supabase remoto
- Project ref: `ehsrjjflwrmmegfvupch`.
- RLS habilitado nas tabelas públicas.
- Tabelas adicionais `topic_lessons` e `topic_progress`, com privilégios e políticas restritivas.
- Conta de teste: perfil preservado; 0 sessões, 0 tentativas e 0 simulados vazios após limpeza autorizada.
- Banco das questões autorais: 22, com explicações e vínculo de tópico; `is_verified=false` até revisão humana.

## Pendências
1. Testar aulas e sessões no navegador com a conta real.
2. Professor IA (depende de configurar a chave de API do provedor no Supabase Edge Function Secrets).
3. Ampliar e revisar o banco de questões; importar prova SBMG 2019 separadamente, conferindo caderno e gabarito.
4. Simulado completo de 70 questões com distribuição oficial.
5. Laboratório de redação com os quatro critérios do edital.
6. Revisão espaçada e flashcards.
7. Habilitar Leaked Password Protection no Supabase Auth.

## Segurança
O repositório GitHub é público. Não versionar secrets, gabaritos ou credenciais. Chaves secret/service-role e credenciais de modelos ficam somente no servidor. As 22 questões autorais não foram marcadas como verificadas por revisão humana.
