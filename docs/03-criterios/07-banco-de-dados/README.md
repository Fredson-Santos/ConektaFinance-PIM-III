# 🗄️ Etapa 7 — Projeto do Banco de Dados

> **Critério 07 · 1,0 pt** — Disciplina: Programação de Banco de Dados.

## O que o manual pede

Modelo lógico, modelo físico, MER, procedures, triggers e script completo do banco usado pelas APIs, Web e Mobile.

## Especificações nesta pasta

| Arquivo | Conteúdo |
| --- | --- |
| [`03_MODELO_DADOS.md`](03_MODELO_DADOS.md) | Dicionário e modelo de dados |
| [`DIAGRAMA_ER.md`](DIAGRAMA_ER.md) | Diagrama ER em Mermaid (planejamento) |
| [`PROCEDURES_TRIGGERS.md`](PROCEDURES_TRIGGERS.md) | Trechos selecionados das procedures, functions e triggers, com a explicação de cada um |

## Evidências no código

- Scripts em [`database/`](../../../database/): `01_schema.sql`, `02_procedures.sql`, `03_triggers.sql`, `04_seed.sql` e o unificado `conektafinance.sql`.
- Diagramas MER, lógico e físico: [`database/diagramas/`](../../../database/diagramas/).
- Testes SQL em [`database/tests/`](../../../database/tests/), executados no CI.
- A API usa PostgreSQL 16 e chama `sp_fechamento_mensal` em `POST /api/v1/reports/monthly-closing`.

## Pendências

- [x] Seleção dos trechos de procedures e triggers ([`PROCEDURES_TRIGGERS.md`](PROCEDURES_TRIGGERS.md))
- [ ] Redação do capítulo com os diagramas e os trechos
