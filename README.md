# Aprova — SBMG Aprova

Aplicação de preparação intensiva para o Concurso para Emprego Público nº 001/2026 da Terminais Aéreos de Maringá (SBMG), cargo **Auxiliar Administrativo/Financeiro**.

## Stack
- React 19 + Vite 8
- Supabase Auth e Postgres
- Supabase Edge Function para corrigir respostas sem expor o gabarito no navegador

## Executar localmente
1. Instale Node.js 20.19+ ou 22.12+.
2. Copie .env.example para .env.local.
3. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.
4. Execute npm install e npm run dev.

## Supabase
O projeto remoto usado nesta implantação é ehsrjjflwrmmegfvupch. O schema, RLS, disciplinas e tópicos da trilha inicial já foram aplicados no projeto Aprova. A tabela questions permite ao navegador ler enunciados e alternativas, mas não o gabarito nem a explicação.

A Edge Function answer-question está implantada com autenticação obrigatória. Ela valida a sessão, lê o gabarito no servidor e grava a tentativa do usuário.

## Fase atual
- Autenticação por e-mail e senha.
- Perfil inicial do candidato.
- Painel com progresso e sessões.
- Conteúdo do edital 2026 organizado por disciplina e tópico.
- Diagnóstico com 22 questões autorais iniciais.
- Correção e gravação de respostas pelo servidor.

## Fontes
- Edital de Abertura nº 001/2026 — Anexos II, III e IV.
- Prova SBMG 2019 — Auxiliar Administrativo: [caderno](https://arquivos.qconcursos.com/prova/arquivo_prova/80482/fauel-2019-sbmg-pr-auxiliar-administrativo-prova.pdf) e [gabarito](https://arquivos.qconcursos.com/prova/arquivo_gabarito/80482/fauel-2019-sbmg-pr-auxiliar-administrativo-gabarito.pdf).

**Importante:** as 22 questões do diagnóstico são autorais, produzidas a partir do conteúdo do edital 2026. Não são questões oficiais da prova de 2019. O caderno de 2019 será importado separadamente, após conferência questão por questão.
