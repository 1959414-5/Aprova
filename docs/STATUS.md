# Estado do projeto — 19/11/2026

## Implementado
- Projeto React + Vite.
- Integração com Supabase Auth e Postgres.
- Login e cadastro por e-mail e senha.
- Perfil básico automático com disponibilidade variável.
- Painel, trilha de estudos, 5 disciplinas e 45 tópicos.
- Diagnóstico com 22 questões autorais.
- Correção de respostas por Edge Function autenticada.
- Interface responsiva e novo styleguide soft-neumorphic.
- Tema light/dark, com preferência persistida no navegador.
- Workflow GitHub Actions para compilar e publicar no GitHub Pages.

## Ambiente remoto
- Supabase project ref: ehsrjjflwrmmegfvupch
- Edge Function: answer-question (ACTIVE, verify_jwt=true)
- Banco: 15 tabelas públicas com RLS habilitado.
- Conteúdo: 2 concursos, 5 disciplinas, 9 relações concurso-disciplina, 45 tópicos e 22 questões autorais.

## Pendência de publicação
A estrutura de Pages e o workflow estão versionados. Falta selecionar **GitHub Actions** como Source em Settings → Pages e adicionar `https://1959414-5.github.io/Aprova/` aos Redirect URLs do Supabase Auth. Depois, executar o workflow e testar uma conta real.

## Ainda não implementado
1. Professor IA conectado a um provedor de modelo por função server-side.
2. Conteúdo didático completo por tópico.
3. Importação e conferência manual das 50 questões da prova SBMG de 2019.
4. Simulados completos de 70 questões com distribuição oficial.
5. Laboratório de redação com rubrica do edital.
6. Revisão espaçada e flashcards.

## Segurança
O repositório GitHub é público. Nenhum segredo do Supabase ou gabarito deve ser versionado. A chave publishable pode ser usada no cliente com RLS; secret/service-role fica apenas no servidor.
