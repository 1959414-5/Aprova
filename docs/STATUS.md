# Estado do projeto — 19/11/2026

## Implementado e publicado em código
- App React/Vite, tema claro/escuro e layout responsivo.
- Supabase Auth e perfil individual.
- Painel, 5 disciplinas e 45 tópicos do Anexo III.
- 45 aulas autorais com explicações, exemplos, resumos, erros comuns e prática.
- Progresso de tópico separado do tempo de estudo; sessões cronometradas só são salvas ao finalizar.
- Diagnóstico curto com 22 questões proporcionais.
- Simulado de 70 questões, distribuição oficial e nota ponderada server-side.
- Gabarito oculto durante simulado.
- Professor IA contextualizado pela aula; Edge Function autenticada `study-tutor`.
- Laboratório de Redação: temas, salvamento de rascunho, contador de 20–30 linhas e correção por quatro critérios, via `essay-feedback`.
- Revisões e flashcards: 45 cartões iniciais e agendamento de 1, 2, 4, 7 e 15 dias.

## Banco remoto
- Supabase project ref: `ehsrjjflwrmmegfvupch`.
- 45 aulas publicadas.
- 70 questões autorais: 10/10/10/10/30. Todas com `is_verified=false`.
- 45 flashcards publicados, um por tópico.
- `ai_tutor_usage` separa consumo do tutor e correção de redação.
- `essay_submissions` possui proteção para usuário editar apenas rascunhos; pontuações são atualizadas pelo servidor.
- Conta do candidato mantém perfil e está sem sessões, respostas, simulados e progresso de teste.

## Integração de IA
- `OPENAI_API_KEY` deve ficar em Supabase → Edge Functions → Secrets.
- Modelo padrão: `gpt-6.2-sol`.
- Funções ativas: `study-tutor`, `essay-feedback`, `answer-question`, `finish-assessment`.
- Tutor e correção de redação têm limites de 35 solicitações/dia/usuário cada.
- Cobrança da OpenAI API é separada da assinatura ChatGPT. Conta pré-paga nova pode exigir compra mínima de US$ 5; confira/desative recarga automática.

## Pendências antes do uso efetivo
1. Build/deploy e teste visual das telas Redação e Revisões.
2. Testar Professor IA e correção de redação com saldo e sessão autenticada.
3. Revisar humanamente as 70 questões autorais e seus gabaritos.
4. Testar o simulado completo ponta a ponta com conta de teste.
5. Importar e conferir separadamente as questões históricas oficiais de 2019.
6. Habilitar Leaked Password Protection no Supabase Auth.

## Segurança
O repositório é público. Não versionar secrets, chaves, credenciais ou gabaritos. O navegador usa publishable key com RLS; chaves de serviço e OpenAI ficam no servidor.
