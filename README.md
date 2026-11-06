# 📊 ConektaFinance — Gestão Financeira Inteligente

[![CI](https://github.com/Fredson-Santos/ConektaFinance-PIM-IV/actions/workflows/ci.yml/badge.svg)](https://github.com/Fredson-Santos/ConektaFinance-PIM-IV/actions/workflows/ci.yml)
[![.NET 10](https://img.shields.io/badge/.NET-10.0-blueviolet.svg)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![PWA](https://img.shields.io/badge/PWA-instalável-5a0fc8.svg)](https://web.dev/explore/progressive-web-apps)

O **ConektaFinance** é uma plataforma de gestão financeira pessoal desenvolvida pela **Conekta Tech Solutions** (*software house* fictícia) para o **PIM IV** do curso de Análise e Desenvolvimento de Sistemas da UNIP. O projeto continua o MVP do PIM III e integra **aplicação web**, **app mobile (PWA)**, **assistente de IA** e **WhatsApp** sobre uma única API e um único banco de dados.

---

## ✨ Funcionalidades

- **Login pelo WhatsApp:** código de acesso (OTP) enviado pela Evolution API, com onboarding guiado para novos usuários.
- **Lançamentos:** receitas e despesas com categoria, forma de pagamento, recorrência, filtros e paginação.
- **Categorias e orçamentos:** teto mensal por categoria, com alertas em 80% e 100% gerados pela API e por trigger no banco.
- **Dashboard e relatórios:** saldo, entradas e saídas, gráfico semanal, composição de gastos, fechamento mensal (procedure `sp_fechamento_mensal`) e exportação em CSV e PDF.
- **Assistente de IA:** conversa com *function calling*, leitura de nota fiscal por foto, confirmação antes de gravar e *fallback* por regras quando o provedor de IA está fora do ar.
- **Canal WhatsApp:** o mesmo assistente do painel, acessível sem abrir o app.
- **Importação de extratos** e **Command Palette** (Ctrl+K).
- **Painel administrativo:** métricas de uso e gestão de contas (perfil `Admin`).
- **Privacidade:** exportação dos dados, exclusão da conta e trilha de auditoria no banco.
- **Acessibilidade:** WCAG 2.1 AA verificada com testes automatizados (axe), tema claro e escuro e `prefers-reduced-motion`.

---

## 🛠️ Tecnologias

| Camada | Tecnologias |
| --- | --- |
| **Frontend / PWA** | React 19, React Router 7, Vite 8, `vite-plugin-pwa`, Recharts, Lucide, jsPDF, CSS com tokens de design system (Inter e IBM Plex Mono) |
| **Backend** | ASP.NET Core 10 (Web API com Controllers), EF Core 10 + Npgsql, JWT, BCrypt, FluentValidation, ProblemDetails, rate limiting, Serilog, Swagger/OpenAPI |
| **Banco de dados** | PostgreSQL 16 com procedures, functions e triggers em PL/pgSQL |
| **IA** | API compatível com OpenAI (NVIDIA NIM por padrão), modelos de texto e de visão |
| **Mensageria** | Evolution API (WhatsApp), com PostgreSQL e Redis próprios |
| **Infraestrutura** | Docker, Docker Compose, Nginx, Traefik (HTTPS), Dokploy em VPS |
| **Qualidade e CI/CD** | xUnit, Vitest, Testing Library, axe-core, Playwright (E2E), Oxlint, GitHub Actions, GHCR |

---

## ⚙️ Arquitetura

```
        Navegador / PWA instalado              WhatsApp
                  │                                │
                  ▼                                ▼
     ┌──────────────────────────┐      ┌──────────────────────┐
     │ Traefik (HTTPS, Dokploy) │      │    Evolution API     │
     └────────────┬─────────────┘      └──────────┬───────────┘
                  ▼                               │ webhook
     ┌──────────────────────────┐                 │
     │ Nginx: React + PWA       │                 │
     │ /api → proxy reverso     │                 │
     └────────────┬─────────────┘                 │
                  ▼                               ▼
     ┌─────────────────────────────────────────────────────┐
     │ API ASP.NET Core 10                                 │
     │ Controllers → Application → Domain ← Infrastructure │──► Provedor de IA
     └────────────────────────┬────────────────────────────┘
                              ▼
     ┌─────────────────────────────────────────────────────┐
     │ PostgreSQL 16: tabelas, procedures, triggers         │
     │ backup diário (pg_dump, 7 dias)                      │
     └─────────────────────────────────────────────────────┘
```

O backend segue uma arquitetura em camadas, com injeção de dependência por interfaces. Web, PWA e WhatsApp gravam pela mesma API no mesmo banco, que é a fonte única de verdade. Os diagramas de camadas, de classes, do service worker e da nuvem estão em [`docs/01-relatorio-abnt/figuras/diagramas/`](docs/01-relatorio-abnt/figuras/diagramas/), e o MER e os modelos lógico e físico, em [`database/diagramas/`](database/diagramas/).

---

## 📂 Estrutura do repositório

```
ConektaFinance-PIM-IV/
├── backend/                 # API ASP.NET Core 10
│   ├── Controllers/         # Endpoints REST (api/v1)
│   ├── Application/         # Serviços, DTOs, validadores e middlewares
│   ├── Domain/              # Entidades, enums e interfaces dos repositórios
│   ├── Infrastructure/      # EF Core, repositórios, IA, WhatsApp, health checks
│   ├── tests/               # Testes unitários, de integração e E2E (Playwright)
│   └── Dockerfile
├── frontend/                # React + Vite + PWA
│   ├── src/                 # Views, componentes, contextos, hooks e serviços
│   ├── nginx.conf           # Servidor estático e proxy /api
│   └── Dockerfile
├── database/                # Scripts SQL, testes SQL e diagramas (ver database/README.md)
├── docs/                    # Documentação do PIM IV por critério do manual (ver docs/README.md)
├── legacy/                  # Frontend e documentação do PIM III
├── .github/workflows/       # CI (build, lint, testes, banco) e CD (GHCR + Dokploy)
├── docker-compose.yml       # API, frontend, PostgreSQL, backup e Evolution API
└── .env.example             # Variáveis de ambiente
```

---

## 🚀 Como executar

### Opção 1: Docker Compose (recomendado)

Pré-requisito: [Docker](https://www.docker.com/) com Docker Compose.

```bash
cp .env.example .env
# Preencha pelo menos JWT_SECRET e CONEKTA_POSTGRES_PASSWORD.
# Opcional: Copilot__ApiKey (IA), Admin__Email/Admin__Password (painel admin) e as variáveis EVOLUTION_* (WhatsApp).
docker compose up -d --build
```

| Serviço | Endereço |
| --- | --- |
| Aplicação (frontend + `/api`) | http://localhost:9001 |
| PostgreSQL (somente local) | `127.0.0.1:5433` |
| Evolution API | http://localhost:8082 |

Na primeira subida, a API aplica as migrations, as procedures e as triggers e cria a conta de demonstração. Comandos úteis: `docker compose ps`, `docker compose logs -f backend` e `docker compose down`.

### Opção 2: Desenvolvimento local

Pré-requisitos: [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0), [Node.js](https://nodejs.org/) 22 (a mesma versão do CI) e Docker (para o PostgreSQL).

**1. Banco de dados**

```bash
cp .env.example .env              # preencha CONEKTA_POSTGRES_PASSWORD
docker compose up -d postgres     # publica o PostgreSQL em 127.0.0.1:5433
```

**2. Backend** (em `backend/`)

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5433;Database=conektafinance;Username=conekta;Password=<sua senha>"
dotnet run --launch-profile http
```

A API sobe em http://localhost:5041, com o Swagger em http://localhost:5041/swagger. Em desenvolvimento, se o `JWT_SECRET` não estiver definido, a API gera uma chave temporária. Sem a Evolution API configurada, o código de login aparece no log do backend (`Otp:DevMode`).

**3. Frontend** (em `frontend/`)

```bash
npm install
npm run dev
```

Abra http://localhost:5173. O Vite encaminha `/api` para o backend na porta 5041.

---

## 🔑 Conta de demonstração

A tela de login tem um botão de **acesso rápido de demonstração** (`POST /api/v1/auth/demo`), que entra numa conta já populada com categorias, tetos e lançamentos do mês corrente.

| E-mail | Senha |
| --- | --- |
| `demo@conektafinance.com` | `Demo@12345` |

O painel administrativo (`/admin`) fica disponível para o usuário definido em `Admin__Email` e `Admin__Password` no `.env`.

---

## ✅ Testes

```bash
# Backend: testes unitários e de integração (xUnit)
cd backend && dotnet test

# Frontend: testes, acessibilidade (axe), lint e build
cd frontend && npm test && npm run lint && npm run build

# Banco: script completo e testes das procedures e triggers (ver database/README.md)
```

O CI (`.github/workflows/ci.yml`) roda tudo isso a cada push, inclusive o job de banco, que executa os scripts SQL num PostgreSQL limpo. O CD (`cd.yml`) publica as imagens no GHCR e aciona o deploy no Dokploy.

---

## 📚 Documentação

| Documento | Local |
| --- | --- |
| Índice da documentação do PIM IV, por critério do manual | [`docs/README.md`](docs/README.md) |
| **Guia para a redação do relatório ABNT** | [`docs/01-relatorio-abnt/GUIA_DE_ENTREGA.md`](docs/01-relatorio-abnt/GUIA_DE_ENTREGA.md) |
| Contrato da API REST | [`docs/03-criterios/04-solucao-web/04_CONTRATO_API.md`](docs/03-criterios/04-solucao-web/04_CONTRATO_API.md) |
| Agente de IA e integração com WhatsApp | [`07_AGENTE_IA.md`](docs/03-criterios/04-solucao-web/07_AGENTE_IA.md) e [`08_WHATSAPP.md`](docs/03-criterios/04-solucao-web/08_WHATSAPP.md) |
| Banco de dados | [`database/README.md`](database/README.md) |
| Planejamento e fases | [`docs/02-planejamento/`](docs/02-planejamento/) |
| Quadro Kanban | [GitHub Project](https://github.com/users/Fredson-Santos/projects/1) |
| Manual do Usuário (versão do PIM III, em atualização) | [`legacy/docs-pim-III/MANUAL_DO_USUARIO.md`](legacy/docs-pim-III/MANUAL_DO_USUARIO.md) |

---

## 👥 Integrantes do grupo

* **Fredson Silva dos Santos** — RA: `R427FB0`
* **Anderson Raulino da Silva** — RA: `F3620J8`
* **Eduardo de Sousa Pereira** — RA: `H759CH8`
* **Matheus da Silva Brito** — RA: `R839DA4`
* **Raphael Caique da S. Negreiros** — RA: `R850765`
* **Miguel dos Santos M. Siroma** — RA: `R540EA6`
