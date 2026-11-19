# Estado do projeto — 19/11/2026

## Implementado

- Projeto React + Vite com dependências fixadas.
- Integração do navegador com Supabase por publishable key.
- Login e cadastro por e-mail e senha.
- Criação automática de perfil básico, com disponibilidade variável.
- Painel com contagem regressiva, progresso, questões respondidas e tempo registrado.
- Sala de estudos com cinco disciplinas e 45 tópicos do Anexo III.
- Diagnóstico inicial com 22 questões autorais, identificadas como conteúdo não oficial.
- Registro de tentativas e correção de alternativa por Edge Function autenticada.
- Proteção de gabarito: navegador sem permissão para ler correct_option e explanation.
- Interface responsiva para desktop e celular.

## Ambiente remoto

- Supabase project ref: ehsrjjflwrmmegfvupch
- Edge Function: answer-question (ACTIVE, verify_jwt=true)
- Banco: 15 tabelas públicas com RLS habilitado.
- Conteúdo: 2 concursos, 5 disciplinas, 9 associações de disciplinas e concursos, 45 tópicos e 22 questões autorais.

## Ainda não implementado

1. Teste ponta a ponta com uma conta real de candidato.
2. Build de produção e implantação em hospedagem.
3. Professor IA conectado a um provedor de modelo por função server-side.
4. Conteúdo didático completo por tópico (teoria, exemplos, resumo e exercício).
5. Importação e conferência manual das 50 questões da prova SBMG de 2019.
6. Simulados completos de 70 questões com distribuição oficial, tempo e pontuação final.
7. Laboratório de redação com rubrica de 4 critérios do edital.
8. Revisão espaçada e flashcards.
9. Plano dinâmico diário ajustado aos horários realmente disponíveis.

## Segurança

O repositório GitHub é público. Nenhum segredo do Supabase ou gabarito completo deve ser versionado. O gabarito das 22 questões autorais está no banco remoto e é acessado pela função answer-question. A publishable key pode ser usada no cliente com RLS, mas a secret/service-role key deve permanecer apenas no servidor.
