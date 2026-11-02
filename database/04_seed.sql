-- ============================================================================
-- ConektaFinance - Carga inicial de demonstracao (PostgreSQL 16)
-- Espelha backend/Infrastructure/Persistence/SeedData.cs e CategoryTemplates.cs.
-- Conta demo: demo@conektafinance.com / Demo@12345 (hash BCrypt).
-- Nao faz nada se a conta demo ja existir (a API tambem semeia no primeiro start).
-- ============================================================================

DO $$
DECLARE
    v_user_id integer;
    v_mes     date := date_trunc('month', timezone('utc', now()))::date;
    v_cat     record;
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE email = 'demo@conektafinance.com') THEN
        RAISE NOTICE 'Conta demo ja existe; seed ignorado.';
        RETURN;
    END IF;

    INSERT INTO users (full_name, display_name, email, phone, occupation, password_hash,
                       account_type, monthly_ceiling, currency, cycle_start_day, onboarding_completed_at)
    VALUES ('Usuário Demo', 'Fred', 'demo@conektafinance.com', '11987654321', 'Desenvolvedor de Software',
            '$2a$11$LI1eybmEMZgxudq5UwirNe6UEDJDra44qYloJr0hBiuWGCjHAvMfa',
            'Standard', 6350.00, 'BRL', 1, timezone('utc', now()))
    RETURNING id INTO v_user_id;

    -- 13 categorias padrao (0 = despesa, 1 = receita)
    INSERT INTO categories (user_id, name, description, color_code, icon, kind, is_system, sort_order)
    VALUES
        (v_user_id, 'Alimentação',     'Restaurantes, supermercados e delivery', '#ef4444', 'Utensils',      0, true, 1),
        (v_user_id, 'Transporte',      'Uber, ônibus e combustível',             '#0070f3', 'Car',           0, true, 2),
        (v_user_id, 'Lazer',           'Cinema, viagens e hobbies',              '#00cc88', 'Film',          0, true, 3),
        (v_user_id, 'Moradia',         'Aluguel, contas e manutenção',           '#f5a623', 'Home',          0, true, 4),
        (v_user_id, 'Saúde',           'Farmácia, planos e consultas',           '#e93d82', 'HeartPulse',    0, true, 5),
        (v_user_id, 'Educação',        'Cursos, livros e materiais',             '#8e4ec6', 'GraduationCap', 0, true, 6),
        (v_user_id, 'Outros',          'Diversos e não classificados',           '#888888', 'Tag',           0, true, 7),
        (v_user_id, 'Salário',         'Remuneração mensal fixa',                '#00cc88', 'Wallet',        1, true, 8),
        (v_user_id, 'Investimentos',   'Rendimentos e aplicações',               '#12b5cb', 'LineChart',     1, true, 9),
        (v_user_id, 'Freelance',       'Projetos e trabalhos extras',            '#8e4ec6', 'Briefcase',     1, true, 10),
        (v_user_id, 'Dividendos',      'Proventos de ações e FIIs',              '#f5a623', 'PiggyBank',     1, true, 11),
        (v_user_id, 'Reembolso',       'Valores devolvidos e estornos',          '#e93d82', 'RotateCcw',     1, true, 12),
        (v_user_id, 'Outras entradas', 'Entradas diversas',                      '#888888', 'Landmark',      1, true, 13);

    -- Tetos por categoria nos ultimos 6 meses
    FOR v_cat IN
        SELECT c.id, t.limite
          FROM categories c
          JOIN (VALUES ('Alimentação', 1500.00), ('Transporte', 600.00), ('Lazer', 800.00),
                       ('Moradia', 2300.00), ('Saúde', 400.00)) AS t(nome, limite)
            ON t.nome = c.name
         WHERE c.user_id = v_user_id
    LOOP
        INSERT INTO budgets (user_id, category_id, limit_value, period_month, period_year)
        SELECT v_user_id, v_cat.id, v_cat.limite,
               EXTRACT(MONTH FROM m)::integer, EXTRACT(YEAR FROM m)::integer
          FROM generate_series(v_mes - interval '5 months', v_mes, interval '1 month') AS m;
    END LOOP;

    -- Lancamentos: receitas e despesas recorrentes dos ultimos 6 meses + gastos do mes atual.
    -- payment_method: 0 Cartao, 1 Pix, 2 Boleto, 3 Debito, 4 Dinheiro, 5 Transferencia, 6 Outro
    INSERT INTO transactions (user_id, category_id, type, description, value, transaction_date,
                              payment_method, is_recurrent, status, source)
    SELECT v_user_id, c.id, l.tipo, l.descricao, l.valor, m + (l.dia - 1) * interval '1 day' + interval '12 hours',
           l.pagamento, l.recorrente, 0, 0
      FROM generate_series(v_mes - interval '5 months', v_mes, interval '1 month') AS m
     CROSS JOIN (VALUES
            ('Salário',   1, 'Salário mensal',          7800.00,  5, 5, true),
            ('Moradia',   0, 'Aluguel',                 1850.00, 10, 2, true),
            ('Moradia',   0, 'Conta de energia',         210.00, 12, 2, true),
            ('Saúde',     0, 'Plano de saúde',           320.00, 15, 0, true),
            ('Alimentação', 0, 'Supermercado do mês',    890.00,  8, 0, false),
            ('Transporte',  0, 'Combustível',            380.00,  9, 3, false),
            ('Lazer',     0, 'Assinatura de streaming',   39.90, 20, 0, true)
         ) AS l(categoria, tipo, descricao, valor, dia, pagamento, recorrente)
      JOIN categories c ON c.user_id = v_user_id AND c.name = l.categoria
     WHERE m + (l.dia - 1) * interval '1 day' <= timezone('utc', now());

    INSERT INTO transactions (user_id, category_id, type, description, value, transaction_date,
                              payment_method, is_recurrent, status, source)
    SELECT v_user_id, c.id, 0, l.descricao, l.valor, timezone('utc', now()) - l.dias * interval '1 day',
           l.pagamento, false, 0, 0
      FROM (VALUES
            ('Alimentação', 'Restaurante japonês',  145.00, 2, 0),
            ('Alimentação', 'Delivery de pizza',     78.50, 1, 1),
            ('Transporte',  'Corridas de aplicativo', 64.20, 3, 0),
            ('Lazer',       'Cinema com amigos',      85.00, 4, 0),
            ('Lazer',       'Show festival',         210.00, 2, 0),
            ('Lazer',       'Parque aquático',       280.00, 1, 1),
            ('Educação',    'Curso online',          189.90, 5, 0)
         ) AS l(categoria, descricao, valor, dias, pagamento)
      JOIN categories c ON c.user_id = v_user_id AND c.name = l.categoria;

    -- Consolida o mes anterior com a procedure de fechamento.
    CALL sp_fechamento_mensal(v_user_id,
                              EXTRACT(YEAR FROM v_mes - interval '1 month')::integer,
                              EXTRACT(MONTH FROM v_mes - interval '1 month')::integer);

    RAISE NOTICE 'Conta demo criada (id %).', v_user_id;
END;
$$;
