-- ============================================================================
-- Testes das procedures e functions (database/02_procedures.sql)
-- Executar apos conektafinance.sql: psql -v ON_ERROR_STOP=1 -f database/tests/test_procedures.sql
-- Tudo roda em transacao desfeita ao final (ROLLBACK).
-- ============================================================================
BEGIN;

DO $$
DECLARE
    v_user  integer;
    v_cat   integer;
    v_renda integer;
    v_st    record;
    v_fech  record;
BEGIN
    INSERT INTO users (full_name, email, password_hash, monthly_ceiling)
    VALUES ('Teste Procedures', 'teste.procedures@conekta.local', 'x', 1000)
    RETURNING id INTO v_user;
    INSERT INTO categories (user_id, name, color_code, icon, kind, is_system)
    VALUES (v_user, 'Mercado', '#ef4444', 'Tag', 0, false) RETURNING id INTO v_cat;
    INSERT INTO categories (user_id, name, color_code, icon, kind, is_system)
    VALUES (v_user, 'Salario', '#00cc88', 'Tag', 1, false) RETURNING id INTO v_renda;

    -- Sem teto definido -> noLimit
    SELECT * INTO v_st FROM fn_status_orcamento(v_user, v_cat, 2026, 3);
    ASSERT v_st.status = 'noLimit', format('esperado noLimit, obtido %s', v_st.status);

    INSERT INTO budgets (user_id, category_id, limit_value, period_month, period_year)
    VALUES (v_user, v_cat, 100, 3, 2026);

    -- 79,99% -> ok
    INSERT INTO transactions (user_id, category_id, type, description, value, transaction_date, is_recurrent, status, source)
    VALUES (v_user, v_cat, 0, 'A', 79.99, '2026-03-10', false, 0, 0);
    SELECT * INTO v_st FROM fn_status_orcamento(v_user, v_cat, 2026, 3);
    ASSERT v_st.status = 'ok', format('79,99%%: esperado ok, obtido %s', v_st.status);

    -- 80% -> warn
    INSERT INTO transactions (user_id, category_id, type, description, value, transaction_date, is_recurrent, status, source)
    VALUES (v_user, v_cat, 0, 'B', 0.01, '2026-03-11', false, 0, 0);
    SELECT * INTO v_st FROM fn_status_orcamento(v_user, v_cat, 2026, 3);
    ASSERT v_st.status = 'warn' AND v_st.percentual = 80, format('80%%: obtido %s / %s', v_st.status, v_st.percentual);

    -- 100% -> warn (o excesso so comeca acima de 100%)
    INSERT INTO transactions (user_id, category_id, type, description, value, transaction_date, is_recurrent, status, source)
    VALUES (v_user, v_cat, 0, 'C', 20, '2026-03-12', false, 0, 0);
    SELECT * INTO v_st FROM fn_status_orcamento(v_user, v_cat, 2026, 3);
    ASSERT v_st.status = 'warn', format('100%%: esperado warn, obtido %s', v_st.status);

    -- 100,01% -> over
    INSERT INTO transactions (user_id, category_id, type, description, value, transaction_date, is_recurrent, status, source)
    VALUES (v_user, v_cat, 0, 'D', 0.01, '2026-03-13', false, 0, 0);
    SELECT * INTO v_st FROM fn_status_orcamento(v_user, v_cat, 2026, 3);
    ASSERT v_st.status = 'over', format('100,01%%: esperado over, obtido %s', v_st.status);

    -- Lancamento cancelado e de outro mes nao entram na conta
    INSERT INTO transactions (user_id, category_id, type, description, value, transaction_date, is_recurrent, status, source)
    VALUES (v_user, v_cat, 0, 'Cancelado', 500, '2026-03-14', false, 1, 0),
           (v_user, v_cat, 0, 'Abril', 500, '2026-04-01', false, 0, 0);
    SELECT * INTO v_st FROM fn_status_orcamento(v_user, v_cat, 2026, 3);
    ASSERT v_st.gasto = 100.01, format('gasto de marco: esperado 100.01, obtido %s', v_st.gasto);

    -- Fechamento mensal
    INSERT INTO transactions (user_id, category_id, type, description, value, transaction_date, is_recurrent, status, source)
    VALUES (v_user, v_renda, 1, 'Salario', 3000, '2026-03-05', false, 0, 0);
    CALL sp_fechamento_mensal(v_user, 2026, 3);
    CALL sp_fechamento_mensal(v_user, 2026, 3); -- reexecucao atualiza, nao duplica

    SELECT * INTO v_fech FROM monthly_closings WHERE user_id = v_user AND period_year = 2026 AND period_month = 3;
    ASSERT (SELECT count(*) FROM monthly_closings WHERE user_id = v_user) = 1, 'fechamento duplicado';
    ASSERT v_fech.total_income = 3000, format('receitas: %s', v_fech.total_income);
    ASSERT v_fech.total_expense = 100.01, format('despesas: %s', v_fech.total_expense);
    ASSERT v_fech.balance = 2899.99, format('saldo: %s', v_fech.balance);
    ASSERT v_fech.ceiling_percentage = 10.00, format('percentual do teto: %s', v_fech.ceiling_percentage);
    ASSERT v_fech.top_category_id = v_cat, 'categoria de maior gasto incorreta';
    ASSERT v_fech.transaction_count = 5, format('quantidade: %s', v_fech.transaction_count);

    -- Mes invalido deve falhar
    BEGIN
        CALL sp_fechamento_mensal(v_user, 2026, 13);
        ASSERT false, 'mes 13 deveria gerar erro';
    EXCEPTION WHEN raise_exception THEN
        NULL;
    END;

    RAISE NOTICE 'test_procedures: OK';
END;
$$;

ROLLBACK;
