<p align="center">
  <img src="https://img.shields.io/badge/APROVA-PLATAFORMA%20DE%20ESTUDOS-f15aa7?style=for-the-badge&labelColor=150f18" alt="Aprova — Plataforma de estudos" />
</p>

<h1 align="center">Aprova · Plataforma de estudos</h1>

<p align="center">
  <strong>Uma plataforma educacional para organizar a preparação, acompanhar a evolução e praticar com feedback estruturado.</strong>
</p>

<p align="center">
  <a href="https://1959414-5.github.io/Aprova/"><img src="https://img.shields.io/badge/ACESSAR_DEMONSTRAÇÃO-f15aa7?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Demonstração" /></a>
  <a href="https://1959414-5.github.io/meu-portfolio/projeto-aprova.html"><img src="https://img.shields.io/badge/ESTUDO_DE_CASO-35263d?style=for-the-badge&logo=readthedocs&logoColor=white" alt="Estudo de caso" /></a>
</p>

<p align="center">
  <img src="images/visao-geral.webp" alt="Visão geral da plataforma Aprova" width="92%" />
</p>

---

## Visão geral

O **Aprova** é uma aplicação web voltada à preparação para concursos e organização de estudos. A plataforma reúne conteúdo estruturado, acompanhamento individual de progresso, avaliações e recursos de apoio ao aprendizado em um único ambiente.

O projeto começou com um recorte de preparação para um concurso específico e evoluiu para uma experiência de estudo mais abrangente, com recursos que podem ser organizados conforme o objetivo do candidato.

## Funcionalidades

| Área | Recursos |
|---|---|
| **Trilhas e aulas** | Organização por disciplinas e tópicos, aulas estruturadas, explicações, exemplos e exercícios. |
| **Plano de estudos** | Plano flexível, metas de duração e acompanhamento das sessões de estudo. |
| **Diagnóstico** | Avaliação inicial para identificar pontos de domínio e oportunidades de revisão. |
| **Simulados** | Questões, registro de alternativas, cálculo de desempenho e revisão do gabarito comentado após finalizar. |
| **Flashcards e revisão** | Apoio à memorização e retomada programada dos conteúdos. |
| **Redação** | Aulas, prática, temas, rascunhos e feedback orientado por critérios. |
| **Professor com IA** | Apoio contextualizado ao conteúdo estudado e feedback assistido por IA, com processamento no servidor. |
| **Progresso individual** | Registro de tópicos concluídos, sessões e evolução vinculados ao usuário. |

## Tecnologias

<p>
  <img src="https://img.shields.io/badge/React-35263d?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-35263d?style=for-the-badge&logo=vite&logoColor=646CFF" alt="Vite" />
  <img src="https://img.shields.io/badge/JavaScript-35263d?style=for-the-badge&logo=javascript&logoColor=F7DF1E" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Supabase-35263d?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-35263d?style=for-the-badge&logo=postgresql&logoColor=4169E1" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Playwright-35263d?style=for-the-badge&logo=playwright&logoColor=45ba4b" alt="Playwright" />
  <img src="https://img.shields.io/badge/OpenAI_API-35263d?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI API" />
</p>

- **React:** interface componentizada.
- **Vite:** ambiente de desenvolvimento e build.
- **Supabase Auth:** autenticação de usuários.
- **PostgreSQL:** persistência de conteúdos, avaliações e progresso.
- **Supabase Edge Functions:** operações de servidor e integrações com IA.
- **Row Level Security (RLS):** isolamento de dados por usuário.
- **Playwright:** testes ponta a ponta.

## Arquitetura e segurança

A aplicação separa a interface das operações que precisam ocorrer no servidor. As operações sensíveis, como correção, tutor e feedback de redação com IA, são realizadas por Edge Functions.

Princípios adotados:

- Dados individuais protegidos por políticas de RLS.
- Chaves privadas e credenciais mantidas em secrets do ambiente de servidor.
- A chave pública do Supabase é utilizada no frontend com as políticas de acesso habilitadas.
- Respostas, progresso e sessões são associados ao usuário autenticado.
- O gabarito de avaliações é liberado conforme o fluxo de finalização definido pela aplicação.

**Não publique service-role keys, tokens, chaves de provedores ou credenciais em arquivos versionados.**

## Executar localmente

Requisitos: Node.js 22 ou versão compatível com as dependências do projeto.

1. Clone o repositório:

```bash
git clone https://github.com/1959414-5/Aprova.git
cd Aprova
```

2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env.local` baseado em `.env.example` e configure as variáveis públicas necessárias do Supabase:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

4. Inicie o ambiente:

```bash
npm run dev
```

5. Gere a versão de produção:

```bash
npm run build
npm run preview
```

## Testes

O projeto contém configuração para testes ponta a ponta com Playwright.

```bash
npm run test:e2e
```

A execução dos testes pode exigir a instalação dos navegadores do Playwright e a configuração do ambiente correspondente.

## Estrutura do repositório

| Diretório/arquivo | Responsabilidade |
|---|---|
| `src/` | Interface e lógica da aplicação. |
| `public/` | Recursos estáticos. |
| `content/` | Conteúdos estruturados das aulas e tópicos, quando versionados. |
| `supabase/` | Estruturas SQL, migrations e Edge Functions. |
| `tests/` | Testes automatizados. |
| `docs/` | Documentação complementar e configuração de publicação. |
| `.env.example` | Modelo de variáveis de ambiente sem credenciais. |

## Demonstração e documentação

- [Aplicação publicada](https://1959414-5.github.io/Aprova/)
- [Estudo de caso no portfólio](https://1959414-5.github.io/meu-portfolio/projeto-aprova.html)
- [Configuração do GitHub Pages](docs/GITHUB-PAGES.md)
- [Professor IA](docs/PROFESSOR-IA.md)

## Autoria

**Bárbara Cabral Paschoalin**  
Desenvolvimento de Software · Dados · Automação

- [Portfólio](https://1959414-5.github.io/meu-portfolio/)
- [GitHub](https://github.com/1959414-5)
- [LinkedIn](https://www.linkedin.com/in/b%C3%A1rbara-paschoalin-980b52185/)

---

<p align="center"><sub>Projeto de portfólio em evolução contínua.</sub></p>
