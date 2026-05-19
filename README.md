# 📊 ConektaFinance — Sistema de Controle Financeiro Pessoal

[![.NET 10.0](https://img.shields.io/badge/.NET-10.0-blueviolet.svg)](https://dotnet.microsoft.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-blue.svg)](https://www.sqlite.org/)
[![Docker Compose](https://img.shields.io/badge/Container-Docker_Compose-blue.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

O **ConektaFinance** é um sistema completo de gestão de finanças pessoais desenvolvido como projeto para o **PIM III** da Conekta (Software House fictícia). O sistema foi projetado para oferecer controle dinâmico de despesas, receitas, orçamentos por categoria, alertas automáticos de limite de gastos e insights gerados de maneira inteligente para auxiliar no planejamento financeiro do usuário.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
* **Core**: HTML5 semântico, JavaScript (Vanilla ES6)
* **Estilização**: Vanilla CSS3 com variáveis de design system, fontes modernizadas (Outfit e Playfair Display) e suporte robusto para responsividade (Mobile e Tablet)
* **Gráficos**: Chart.js integrado para visualização de tendências e divisão de despesas por categoria

### Backend
* **Runtime**: ASP.NET Core 10.0 Web API (Controllers)
* **Banco de Dados**: SQLite (EF Core 10) com geração e migração automática de banco no startup
* **Segurança**: Autenticação via Token JWT, Criptografia de senhas com BCrypt.Net e validação de requisições com FluentValidation
* **Logs & Documentação**: Serilog para registros detalhados e Swagger/OpenAPI para documentação de rotas da API

### Infraestrutura & Deploy
* **Servidor Web & Proxy**: Nginx atuando como servidor de arquivos estáticos e proxy reverso para unificar rotas `/api`
* **Containerização**: Docker e Docker Compose para isolamento de serviços e deploy ágil em ambiente de produção (VPS)

---

## ⚙️ Arquitetura do Projeto

O sistema é dividido em dois módulos principais desacoplados que se comunicam através de requisições HTTP RESTful:

```
┌────────────────────────────────────────┐
│             Navegador (Client)         │
└───────────────────┬────────────────────┘
                    │ (Porta 80 / 443)
                    ▼
┌────────────────────────────────────────┐
│             Nginx Web Server           │
├───────────────────┬────────────────────┤
│ / (Static Files)  │ /api (Reverse Proxy)│
└─────────┬─────────┴─────────┬──────────┘
          │                   │
          ▼                   ▼
┌───────────────────┐ ┌──────────────────┐
│  HTML, CSS, JS    │ │ ASP.NET Core API │
│   (Frontend)      │ │   (Backend)      │
└───────────────────┘ └────────┬─────────┘
                               │ (EF Core 10)
                               ▼
                      ┌──────────────────┐
                      │  SQLite Database │
                      │ (Volume Mapeado) │
                      └──────────────────┘
```

---

## 📂 Estrutura de Diretórios

```
PIM-III/
├── backend/                  # Código-fonte da Web API .NET 10
│   ├── Application/          # Regras de negócio, interfaces e DTOs
│   ├── Controllers/          # Endpoints da API HTTP
│   ├── Domain/               # Entidades, Enums e Interfaces básicas
│   ├── Infrastructure/       # Acesso a dados, contexto EF Core e Repositórios
│   ├── Properties/           # Configurações de inicialização da API
│   ├── Dockerfile            # Arquivo de containerização do backend
│   └── PIM-III-Backend.csproj
├── frontend/                 # Interface estática do usuário
│   ├── css/                  # Estilos globais e responsivos
│   ├── js/                   # Serviços de API, gráficos e scripts de tela
│   ├── pages/                # Páginas HTML (Dashboard, Gastos, Login, etc)
│   ├── Dockerfile            # Arquivo de containerização do frontend
│   └── nginx.conf            # Configuração de proxy e rotas do Nginx
├── docs/                     # Planejamento, especificações e tasks do projeto
├── docker-compose.yml        # Configuração do deploy local/produção em containers
└── README.md                 # Este documento
```

---

## 🚀 Como Executar o Projeto

Você pode rodar o projeto localmente para desenvolvimento ou via Docker Compose para simular um ambiente de produção (VPS).

### Opção 1: Desenvolvimento Local (Manual)

#### Pré-requisitos
* [.NET 10.0 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/10.0) instalado.
* Um servidor web simples para o frontend (Ex: extensões do VS Code como Live Server, Node `http-server` ou Python).

#### Passo 1: Executar o Backend
1. Navegue até a pasta `backend/`.
2. Restaure e execute o projeto:
   ```bash
   dotnet run --launch-profile http
   ```
3. A API estará de pé na porta `http://localhost:5041/api`. O Swagger pode ser acessado em `http://localhost:5041/swagger`.

#### Passo 2: Executar o Frontend
1. Navegue até a pasta `frontend/`.
2. Inicie um servidor web na porta `8080` (necessário para compatibilidade com CORS local):
   * Com Node: `npx http-server -p 8080`
   * Com Python: `python -m http.server 8080`
3. Acesse no navegador: `http://localhost:8080/pages/tela-login.html`.

---

### Opção 2: Produção ou Teste via Docker Compose (Recomendado)

Esta opção constrói os containers do frontend e backend, configura o banco SQLite com persistência local e unifica tudo sob a porta padrão HTTP `80` utilizando o Nginx como proxy reverso (eliminando erros de CORS).

#### Pré-requisitos
* [Docker](https://www.docker.com/) e Docker Compose instalados.

#### Execução
1. Na raiz do projeto (onde está o arquivo `docker-compose.yml`), execute:
   ```bash
   docker compose up -d --build
   ```
2. O Docker compilará a imagem .NET, preparará o Nginx e iniciará os serviços em segundo plano.
3. Acesse o sistema diretamente na porta padrão:
   `http://localhost/pages/tela-login.html` (ou o IP/domínio da sua VPS).

#### Comandos Úteis do Docker Compose
* **Ver logs dos serviços**: `docker compose logs -f`
* **Parar os serviços**: `docker compose down`
* **Verificar status dos containers**: `docker compose ps`

---

## 🔒 Credenciais de Teste (Seed Data)

Ao iniciar pela primeira vez, o banco SQLite é migrado e populado automaticamente com os seguintes usuários de teste (senhas em texto plano pré-criptografadas com BCrypt no banco):

| Nome | E-mail | Senha |
|------|--------|-------|
| Usuário Teste | `usuario@teste.com` | `senha123` |
| João Silva | `joao@teste.com` | `senha456` |
| Maria Santos | `maria@teste.com` | `senha789` |
| Ana Oliveira | `ana.oliveira@teste.com` | `senha999` |

*Nota: O Usuário Teste já possui um conjunto completo de transações mockadas de despesas e receitas inseridas nos meses de Abril e Maio de 2026 para fins de demonstração imediata do dashboard.*

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT - consulte o arquivo LICENSE para obter detalhes.
