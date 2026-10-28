# Banco de Dados — ConektaFinance (PostgreSQL 16)

Scripts do banco usado pela API, pela aplicação web e pelo PWA.

| Arquivo | Conteúdo | Origem |
|---|---|---|
| `01_schema.sql` | Modelo físico: tabelas, PK, FK, `UNIQUE`, `CHECK`, índices e comentários | **Gerado** das migrations do EF Core por `build.sh` |
| `02_procedures.sql` | `monthly_closings`, `fn_status_orcamento`, `sp_verificar_orcamento`, `sp_fechamento_mensal` | Manual (idempotente) |
| `03_triggers.sql` | `audit_log`, triggers de `updated_at`, auditoria e alerta de orçamento | Manual (idempotente) |
| `04_seed.sql` | Conta demo, 13 categorias padrão, tetos e lançamentos de exemplo | Manual |
| `conektafinance.sql` | Script completo (`01` → `04`) pronto para execução | **Gerado** por `build.sh` |
| `tests/*.sql` | Testes com `ASSERT` das procedures e triggers | Manual |
| `diagramas/` | MER (`mer`), modelo lógico (`modelo-logico`) e modelo físico (`modelo-fisico`) em PlantUML + PNG | Manual |

## Como a API usa estes scripts

1. No startup, a API aplica as migrations do EF Core, que geram o mesmo schema de `01_schema.sql`.
2. Em seguida, `DatabaseProgrammability` executa `02_procedures.sql` e `03_triggers.sql`, embutidos no assembly do backend.
3. O endpoint `POST /api/v1/reports/monthly-closing` chama `sp_fechamento_mensal`, e a trigger `trg_alerta_orcamento` gera os alertas de orçamento direto no banco.

## Executar localmente

```bash
docker run -d --rm --name conekta-db -e POSTGRES_PASSWORD=dev -p 5434:5432 postgres:16-alpine
createdb -h localhost -p 5434 -U postgres conektafinance
psql -h localhost -p 5434 -U postgres -d conektafinance -v ON_ERROR_STOP=1 -f database/conektafinance.sql
psql -h localhost -p 5434 -U postgres -d conektafinance -v ON_ERROR_STOP=1 -f database/tests/test_procedures.sql
psql -h localhost -p 5434 -U postgres -d conektafinance -v ON_ERROR_STOP=1 -f database/tests/test_triggers.sql
```

Os testes rodam dentro de uma transação desfeita ao final (`ROLLBACK`), sem deixar dados.

## Regenerar os scripts

Depois de alterar entidades ou configurações do EF Core (e criar a migration), rode:

```bash
./database/build.sh
```

O CI (job `database`) regenera os scripts e falha se `01_schema.sql` ou `conektafinance.sql` estiverem desatualizados no commit.

## Exemplos de uso

```sql
-- Situação do teto da categoria 3 do usuário 1 em outubro/2026
SELECT * FROM fn_status_orcamento(1, 3, 2026, 10);

-- Fechamento do mês (insere ou atualiza monthly_closings)
CALL sp_fechamento_mensal(1, 2026, 10);

-- Histórico de alterações de um lançamento
SELECT operation, old_data, new_data, executed_at
  FROM audit_log
 WHERE table_name = 'transactions' AND record_id = 42
 ORDER BY id;
```

## Regenerar os diagramas

```bash
docker run --rm -v "$PWD/database/diagramas:/data" -w /data plantuml/plantuml:1.2025.4 -tpng -charset UTF-8 *.puml
```
