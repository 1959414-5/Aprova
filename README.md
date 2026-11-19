# Aprova — SBMG Aprova

Aplicação de preparação para o Concurso para Emprego Público nº 001/2026 da Terminais Aéreos de Maringá (SBMG), cargo **Auxiliar Administrativo/Financeiro**.

## Publicação
O deploy está preparado pelo GitHub Actions. Site esperado: **https://1959414-5.github.io/Aprova/**.

Para ativar a primeira publicação:
1. Abra Settings → Pages.
2. Em Build and deployment → Source, selecione **GitHub Actions**.
3. Abra a aba Actions e execute novamente o workflow “Deploy Aprova to GitHub Pages”, caso o primeiro disparo tenha ocorrido antes dessa configuração.

Guia detalhado: [docs/GITHUB-PAGES.md](docs/GITHUB-PAGES.md).

## Stack
- React 19 + Vite 8
- Supabase Auth e Postgres
- Supabase Edge Function para correção de respostas sem expor o gabarito no navegador

## Desenvolvimento local
1. Instale Node.js 20.19+ ou 22.12+.
2. Copie .env.example para .env.local.
3. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.
4. Execute npm install e npm run dev.

## Supabase
O projeto remoto usado é ehsrjjflwrmmegfvupch. O schema tem 15 tabelas com RLS habilitado. As questões autorais estão no Supabase; o repositório público não contém gabaritos.

A Edge Function answer-question exige autenticação, consulta o gabarito no servidor e registra a tentativa do usuário.

## Design
- Soft neumorphism inspirado no styleguide aprovado.
- Tema claro e escuro com preferência salva no navegador.
- Interface responsiva para desktop e celular.
- Componentes com bordas suaves, sombras internas/externas e foco menta.

## Conteúdo
- Edital de Abertura nº 001/2026 — Anexos II, III e IV.
- Prova SBMG 2019 — Auxiliar Administrativo: [caderno](https://arquivos.qconcursos.com/prova/arquivo_prova/80482/fauel-2019-sbmg-pr-auxiliar-administrativo-prova.pdf) e [gabarito](https://arquivos.qconcursos.com/prova/arquivo_gabarito/80482/fauel-2019-sbmg-pr-auxiliar-administrativo-gabarito.pdf).

**Importante:** as 22 questões iniciais são autorais, com base no edital de 2026. Não são questões oficiais da prova de 2019.
