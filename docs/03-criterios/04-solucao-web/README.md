# 🌐 Etapa 4 — Desenvolvimento da solução Web

> **Critério 05 · 2,0 pts** — Disciplina: Desenvolvimento Web com .NET.

## O que o manual pede

Arquitetura da aplicação, APIs REST, autenticação, segurança, estrutura administrativa e integração entre módulos.

## Especificações nesta pasta

| Arquivo | Conteúdo |
| --- | --- |
| [`01_INVENTARIO_FRONT.md`](01_INVENTARIO_FRONT.md) | Inventário de telas e componentes do protótipo |
| [`02_PLANO_COMPONENTES.md`](02_PLANO_COMPONENTES.md) | Plano de componentização React |
| [`04_CONTRATO_API.md`](04_CONTRATO_API.md) | Contrato da API REST v1 |
| [`05_GAP_BACKEND.md`](05_GAP_BACKEND.md) | Análise de lacunas do backend |
| [`07_AGENTE_IA.md`](07_AGENTE_IA.md) | Agente de IA com function calling |
| [`08_WHATSAPP.md`](08_WHATSAPP.md) | Integração com WhatsApp (Evolution API) |

## Evidências no código

- API: [`backend/Controllers/`](../../../backend/Controllers/) — JWT, BCrypt, FluentValidation, ProblemDetails, rate limiting, cabeçalhos de segurança e Swagger completo.
- Estrutura administrativa: `AdminController` com `[Authorize(Roles)]` e tela `/admin` em [`frontend/src/views/admin/`](../../../frontend/src/views/admin/).
- Testes de integração: [`backend/tests/Integration/`](../../../backend/tests/Integration/).

## Pendências

- [ ] Prints do Swagger, das telas web e do painel administrativo
- [ ] Redação do capítulo
