-- ============================================================================
-- Testes das triggers (database/03_triggers.sql)
-- Executar apos conektafinance.sql: psql -v ON_ERROR_STOP=1 -f database/tests/test_triggers.sql
-- Tudo roda em transacao desfeita ao final (ROLLBACK).
-- ============================================================================
BEGIN;

DO $$
DECLARE
    v_user    integer;
    v_cat     integer;
    v_renda   integer;
    v_tx      integer;
    v_antes   timestamp;
    v_depois  timestamp;
    v_alertas integer;
BEGIN
    INSERT INTO users (full_name, email, password_hash, monthly_ceiling, updated_at)
    VALUES ('Teste Triggers', 'teste.triggers@conekta.local', 'x', 0, timezone('utc', now()) - interval '1 day')
    RETURNING id, updated_at INTO v_user, v_antes;
    INSERT INTO categories (user_id, name, color_code, icon, kind, is_system)
    VALUES (v_user, 'Lazer', '#00cc88', 'Tag', 0, false) RETURNING id INTO v_cat;
    INSERT INTO categories (user_id, name, color_code, icon, kind, is_system)
    VALUES (v_user, 'Bonus', '#00cc88', 'Tag', 1, false) RETURNING id INTO v_renda;

    -- trg_users_updated_at
    UPDATE users SET occupation = 'Analista' WHERE id = v_user;
    SELECT updated_at INTO v_depois FROM users WHERE id = v_user;
    ASSERT v_depois > v_antes, 'updated_at nao foi atualizado pela trigger';

    -- trg_alerta_orcamento: sem teto nao gera alerta
    INSERT INTO transactions (user_id, category_id, type, description, value, transaction_date, is_recurrent, status, source)
    VALUES (v_user, v_cat, 0, 'Sem teto', 50, '2026-05-02', false, 0, 0);
    ASSERT NOT EXISTS (SELECT 1 FROM alerts WHERE user_id = v_user), 'alerta gerado sem teto definido';

    INSERT INTO budgets (user_id, category_id, limit_value, period_month, period_year)
    VALUES (v_user, v_cat, 200, 5, 2026);

    -- 85% -> alerta de atencao (type 1)
    INSERT INTO transactions (user_id, category_id, type, description, value, transaction_date, is_recurrent, status, source)
    VALUES (v_user, v_cat, 0, 'Show', 120, '2026-05-03', false, 0, 0)
    RETURNING id INTO v_tx;
    ASSERT EXISTS (SELECT 1 FROM alerts WHERE user_id = v_user AND type = 1
                     AND dedup_key = format('cat:%s:2026-05:limit', v_cat)), 'alerta de 80% nao gerado';

    -- Nova despesa ainda abaixo de 100% nao duplica o alerta
    INSERT INTO transactions (user_id, category_id, type, description, value, transaction_date, is_recurrent, status, source)
    VALUES (v_user, v_cat, 0, 'Pipoca', 10, '2026-05-04', false, 0, 0);
    SELECT count(*) INTO v_alertas FROM alerts WHERE user_id = v_user;
    ASSERT v_alertas = 1, format('esperado 1 alerta, obtido %s', v_alertas);

    -- Acima de 100% -> alerta de teto excedido (type 0)
    UPDATE transactions SET value = 180 WHERE id = v_tx;
    ASSERT EXISTS (SELECT 1 FROM alerts WHERE user_id = v_user AND type = 0
                     AND dedup_key = format('cat:%s:2026-05:exceeded', v_cat)), 'alerta de 100% nao gerado';

    -- Receita nao dispara alerta de orcamento
    INSERT INTO transactions (user_id, category_id, type, description, value, transaction_date, is_recurrent, status, source)
    VALUES (v_user, v_renda, 1, 'Bonus', 5000, '2026-05-05', false, 0, 0);
    SELECT count(*) INTO v_alertas FROM alerts WHERE user_id = v_user;
    ASSERT v_alertas = 2, format('esperado 2 alertas, obtido %s', v_alertas);

    -- trg_auditoria_transactions: INSERT, UPDATE e DELETE registrados com antes/depois
    DELETE FROM transactions WHERE id = v_tx;
    ASSERT (SELECT array_agg(operation ORDER BY id) FROM audit_log
             WHERE table_name = 'transactions' AND record_id = v_tx) = ARRAY['INSERT', 'UPDATE', 'DELETE']::varchar[],
           'auditoria de transactions incompleta';
    ASSERT (SELECT (old_data ->> 'value')::numeric = 120 AND (new_data ->> 'value')::numeric = 180
              FROM audit_log WHERE table_name = 'transactions' AND record_id = v_tx AND operation = 'UPDATE'),
           'auditoria do UPDATE sem valores antes/depois';

    -- trg_auditoria_budgets
    ASSERT EXISTS (SELECT 1 FROM audit_log WHERE table_name = 'budgets' AND user_id = v_user AND operation = 'INSERT'),
           'auditoria de budgets nao registrada';

    RAISE NOTICE 'test_triggers: OK';
END;
$$;

ROLLBACK;
