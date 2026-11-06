# Procedures, functions e triggers

Material de apoio ao capítulo 7 (Etapa 7: Programação de Banco de Dados). Os scripts completos ficam em [`database/`](../../../database/). Aqui estão só os trechos que valem entrar no texto, com a explicação de cada um.

**SGBD:** PostgreSQL 16. **Linguagem:** PL/pgSQL. Os arquivos são idempotentes (`CREATE OR REPLACE`, `DROP TRIGGER IF EXISTS`) e a API os aplica sozinha ao iniciar.

## Figuras e arquivos para o capítulo

| Item do manual | Arquivo | Uso no relatório |
| --- | --- | --- |
| MER | `database/diagramas/mer.png` | Figura |
| Modelo lógico | `database/diagramas/modelo-logico.png` | Figura |
| Modelo físico | `database/diagramas/modelo-fisico.png` | Figura (página paisagem, se necessário) |
| Script DDL | `database/01_schema.sql` (312 linhas) | Trecho de uma tabela no texto; script completo em apêndice ou no repositório |
| Procedures e functions | `database/02_procedures.sql` | Trechos abaixo |
| Triggers | `database/03_triggers.sql` | Trechos abaixo |
| Carga inicial | `database/04_seed.sql` | Citar |
| Script completo | `database/conektafinance.sql` (800 linhas, une os quatro anteriores) | Apêndice ou link do repositório |
| Testes | `database/tests/test_procedures.sql` e `test_triggers.sql`, executados no CI | Citar como validação |

Sugestão: não colar as 800 linhas no corpo do trabalho, porque elas consomem páginas do limite de 20 a 30. Coloque os trechos abaixo no texto e o script completo como **Apêndice** (as páginas dos apêndices não contam no desenvolvimento).

---

## Visão geral

| Objeto | Tipo | O que faz | Quem usa |
| --- | --- | --- | --- |
| `fn_status_orcamento` | Function | Calcula gasto, teto, percentual e status (`ok`, `warn`, `over`, `noLimit`) de uma categoria no mês | `sp_verificar_orcamento` e testes de integração |
| `sp_verificar_orcamento` | Procedure | Cria ou atualiza o alerta de 80% e de 100% do teto, sem duplicar | Trigger `trg_alerta_orcamento` |
| `sp_fechamento_mensal` | Procedure | Consolida o mês do usuário (receitas, despesas, saldo, uso do teto e maior categoria) na tabela `monthly_closings` | API: `POST /api/v1/reports/monthly-closing` |
| `fn_set_updated_at` + `trg_*_updated_at` | Trigger | Mantém `updated_at` sempre atualizado em 5 tabelas | Automático |
| `fn_auditoria` + `trg_auditoria_*` | Trigger | Grava em `audit_log` o antes e o depois de cada alteração em lançamentos e orçamentos | Automático |
| `fn_alerta_orcamento` + `trg_alerta_orcamento` | Trigger | Ao registrar ou alterar uma despesa, chama `sp_verificar_orcamento` | Automático |

**Integração com a aplicação:** a API chama a procedure de fechamento em `backend/Infrastructure/Persistence/Repositories/SystemRepositories.cs:155`:

```csharp
await context.Database.ExecuteSqlInterpolatedAsync($"CALL sp_fechamento_mensal({userId}, {year}, {month})");
```

Como as regras de status do orçamento existem tanto no banco quanto no backend (`BudgetStatus.cs`), os dois usam a mesma chave de deduplicação nos alertas. Um lançamento feito pela API, pelo assistente de IA ou direto no banco gera um único alerta por categoria, mês e tipo.

---

## 1. Function `fn_status_orcamento`

`database/02_procedures.sql:46`

```sql
CREATE OR REPLACE FUNCTION fn_status_orcamento(
    p_user_id integer, p_category_id integer, p_ano integer, p_mes integer)
RETURNS TABLE (gasto numeric, limite numeric, percentual numeric, status text)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    v_inicio timestamp := make_date(p_ano, p_mes, 1);
    v_fim    timestamp := make_date(p_ano, p_mes, 1) + interval '1 month';
BEGIN
    SELECT COALESCE(SUM(t.value), 0) INTO gasto
      FROM transactions t
     WHERE t.user_id = p_user_id AND t.category_id = p_category_id
       AND t.type = 0 AND t.status = 0          -- despesa ativa
       AND t.transaction_date >= v_inicio AND t.transaction_date < v_fim;

    SELECT COALESCE(MAX(b.limit_value), 0) INTO limite
      FROM budgets b
     WHERE b.user_id = p_user_id AND b.category_id = p_category_id
       AND b.period_year = p_ano AND b.period_month = p_mes;

    IF limite <= 0 THEN
        percentual := 0;  status := 'noLimit';
    ELSE
        percentual := round(gasto * 100 / limite, 2);
        status := CASE
            WHEN gasto * 100 / limite > 100 THEN 'over'
            WHEN gasto * 100 / limite >= 80 THEN 'warn'
            ELSE 'ok'
        END;
    END IF;
    RETURN NEXT;
END;
$$;
```

**Explicação:** soma as despesas ativas da categoria no mês e compara com o teto do orçamento. A regra é a mesma do backend: sem teto, `noLimit`; acima de 100%, `over`; a partir de 80%, `warn`; abaixo disso, `ok`. É `STABLE` porque só lê dados.

**Exemplo de uso:** `SELECT * FROM fn_status_orcamento(1, 3, 2026, 10);`

---

## 2. Procedure `sp_verificar_orcamento`

`database/02_procedures.sql:105` (trecho principal)

```sql
SELECT * INTO v_situacao FROM fn_status_orcamento(p_user_id, p_category_id, p_ano, p_mes);

IF v_situacao.status = 'over' THEN
    v_chave  := format('cat:%s:%s-%s:exceeded', p_category_id, p_ano, lpad(p_mes::text, 2, '0'));
    v_tipo   := 0;
    v_titulo := format('%s acima do teto', v_nome);
ELSIF v_situacao.status = 'warn' THEN
    v_chave  := format('cat:%s:%s-%s:limit', p_category_id, p_ano, lpad(p_mes::text, 2, '0'));
    v_tipo   := 1;
    v_titulo := format('%s — %s%% do teto', v_nome, round(v_situacao.percentual));
ELSE
    RETURN;
END IF;

INSERT INTO alerts (user_id, category_id, type, title, message, is_read, dedup_key)
VALUES (p_user_id, p_category_id, v_tipo, left(v_titulo, 120), left(v_mensagem, 300), false, v_chave)
ON CONFLICT (user_id, dedup_key) DO UPDATE
    SET type = EXCLUDED.type, title = EXCLUDED.title, message = EXCLUDED.message;
```

**Explicação:** reaproveita a function anterior e, se a categoria passou de 80% ou de 100% do teto, grava um alerta. A chave `dedup_key` mais o `ON CONFLICT ... DO UPDATE` (*upsert*) garantem que vários lançamentos no mesmo mês atualizem o mesmo alerta, em vez de criar um novo a cada despesa. Só categorias de despesa (`kind = 0`) geram alerta.

---

## 3. Procedure `sp_fechamento_mensal`

`database/02_procedures.sql:168` (trecho principal)

```sql
IF p_mes NOT BETWEEN 1 AND 12 THEN
    RAISE EXCEPTION 'Mes invalido: % (use 1 a 12)', p_mes;
END IF;

SELECT COALESCE(SUM(t.value) FILTER (WHERE t.type = 1), 0),   -- receitas
       COALESCE(SUM(t.value) FILTER (WHERE t.type = 0), 0),   -- despesas
       COUNT(*)
  INTO v_receitas, v_despesas, v_quantidade
  FROM transactions t
 WHERE t.user_id = p_user_id AND t.status = 0
   AND t.transaction_date >= v_inicio AND t.transaction_date < v_fim;

INSERT INTO monthly_closings (user_id, period_year, period_month, total_income, total_expense,
                              balance, monthly_ceiling, ceiling_percentage, top_category_id,
                              top_category_total, transaction_count, closed_at)
VALUES (p_user_id, p_ano, p_mes, v_receitas, v_despesas, v_receitas - v_despesas, v_teto,
        CASE WHEN v_teto > 0 THEN round(v_despesas * 100 / v_teto, 2) END,
        v_categoria_id, COALESCE(v_categoria_vl, 0), v_quantidade, now())
ON CONFLICT (user_id, period_year, period_month) DO UPDATE
    SET total_income = EXCLUDED.total_income, total_expense = EXCLUDED.total_expense,
        balance = EXCLUDED.balance, closed_at = EXCLUDED.closed_at;  -- (demais colunas omitidas)
```

**Explicação:** valida o mês e o usuário, soma receitas e despesas numa única varredura (`FILTER`), descobre a categoria com maior gasto e grava o consolidado. Rodar a procedure de novo no mesmo mês atualiza o registro, sem duplicar. É chamada pela API no endpoint de fechamento mensal e alimenta a tela de relatórios.

**Exemplo de uso:** `CALL sp_fechamento_mensal(1, 2026, 10);`

---

## 4. Trigger de `updated_at`

`database/03_triggers.sql:37`

```sql
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := timezone('utc', now());
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
```

**Explicação:** aplicada em `users`, `categories`, `budgets`, `transactions` e `alerts`. Garante a data da última alteração, em UTC, mesmo quando a mudança é feita fora da API (por exemplo, por um administrador direto no banco). Por ser `BEFORE UPDATE`, altera a linha antes de ela ser gravada.

---

## 5. Trigger de auditoria

`database/03_triggers.sql:76`

```sql
CREATE OR REPLACE FUNCTION fn_auditoria()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, record_id, user_id, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, NEW.user_id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, record_id, user_id, old_data, new_data)
        VALUES (TG_TABLE_NAME, TG_OP, NEW.id, NEW.user_id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSE
        INSERT INTO audit_log (table_name, operation, record_id, user_id, old_data)
        VALUES (TG_TABLE_NAME, TG_OP, OLD.id, OLD.user_id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
END;
$$;

CREATE TRIGGER trg_auditoria_transactions
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW EXECUTE FUNCTION fn_auditoria();
```

**Explicação:** uma única função genérica serve para as tabelas `transactions` e `budgets`. Ela registra a operação e a linha inteira, antes e depois, em JSON (`to_jsonb`). A tabela `audit_log` não tem chave estrangeira para `users` de propósito: o histórico continua existindo mesmo depois que a conta é excluída. Esse ponto conversa com o capítulo de segurança e com a LGPD.

---

## 6. Trigger de alerta de orçamento

`database/03_triggers.sql:114`

```sql
CREATE OR REPLACE FUNCTION fn_alerta_orcamento()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    CALL sp_verificar_orcamento(
        NEW.user_id, NEW.category_id,
        EXTRACT(YEAR FROM NEW.transaction_date)::integer,
        EXTRACT(MONTH FROM NEW.transaction_date)::integer);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_alerta_orcamento
    AFTER INSERT OR UPDATE OF value, category_id, transaction_date, status, type ON transactions
    FOR EACH ROW
    WHEN (NEW.type = 0 AND NEW.status = 0)
    EXECUTE FUNCTION fn_alerta_orcamento();
```

**Explicação:** sempre que uma despesa ativa é inserida ou tem valor, categoria, data, status ou tipo alterados, o banco reavalia o teto da categoria naquele mês. A cláusula `WHEN` evita disparar para receitas e lançamentos cancelados, e `UPDATE OF` limita o disparo às colunas que mudam o cálculo.

**Encadeamento para descrever no texto:** `INSERT em transactions` → `trg_alerta_orcamento` → `fn_alerta_orcamento` → `sp_verificar_orcamento` → `fn_status_orcamento` → `INSERT/UPDATE em alerts`.

---

## Validação

- `database/tests/test_procedures.sql` e `database/tests/test_triggers.sql` são executados pelo job de banco do CI (`.github/workflows/ci.yml`) num PostgreSQL limpo.
- O teste de integração `backend/tests/Integration/DatabaseProgrammabilityFlowTests.cs` percorre o fluxo pela API e confere o resultado de `fn_status_orcamento`.

Referências sugeridas (ver [`REFERENCIAS.md`](../../01-relatorio-abnt/REFERENCIAS.md)): Elmasri e Navathe, Silberschatz, Korth e Sudarshan e a documentação oficial do PostgreSQL 16 (capítulos de PL/pgSQL e triggers).
