using System;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace PIM_III_Backend.Infrastructure.Persistence;

public static class SeedData
{
    public static void Initialize(AppDbContext context)
    {
        // Aplicar migrações e garantir que o banco existe
        context.Database.Migrate();


        // Se já houver dados, não fazer seed novamente
        if (context.Users.Any())
            return;

        // Criar usuários de teste
        var users = new List<User>
        {
            new User
            {
                Id = 1,
                Email = "usuario@teste.com",
                PasswordHash = HashPassword("senha123"),
                FullName = "Mariana Souza (Universitária, 21 anos)",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Email = "joao@teste.com",
                PasswordHash = HashPassword("senha456"),
                FullName = "João Silva",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 3,
                Email = "maria@teste.com",
                PasswordHash = HashPassword("senha789"),
                FullName = "Maria Santos",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 4,
                Email = "ana.oliveira@teste.com",
                PasswordHash = HashPassword("senha999"),
                FullName = "Ana Oliveira",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new User
            {
                Id = 5,
                Email = "test@example.com",
                PasswordHash = HashPassword("Test@12345"),
                FullName = "Test User E2E",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        context.Users.AddRange(users);
        context.SaveChanges();

        // Criar orçamentos e dados financeiros para os últimos 6 meses para o usuario@teste.com (UserId = 1)
        var budgets = new List<Budget>();
        var expenses = new List<Expense>();
        var incomes = new List<Income>();
        var alerts = new List<Alert>();

        var today = new DateTime(2026, 6, 10, 0, 0, 0, DateTimeKind.Utc);
        var random = new Random(42); // Seed fixa para reprodutibilidade

        // Categorias e seus limites padrão de orçamento para uma estudante universitária de 21 anos
        var categoryLimits = new Dictionary<int, decimal>
        {
            { 1, 500m },  // Alimentação (Supermercado, R.U., Lanches)
            { 2, 200m },  // Transporte (Passe Escolar, Uber eventual)
            { 3, 250m },  // Lazer (Streaming, Festas Universitárias, Rolês)
            { 4, 100m },  // Saúde (Farmácia, Higiene)
            { 5, 200m },  // Educação (Livros, Xerox, Cursos)
            { 6, 800m }   // Moradia (República / Quarto compartilhado)
        };

        int budgetIdCounter = 1;
        int expenseIdCounter = 1;
        int incomeIdCounter = 1;
        int alertIdCounter = 1;

        for (int i = 5; i >= 0; i--)
        {
            var targetDate = today.AddMonths(-i);
            int year = targetDate.Year;
            int month = targetDate.Month;

            // 1. Orçamentos para o mês
            foreach (var limit in categoryLimits)
            {
                budgets.Add(new Budget
                {
                    Id = budgetIdCounter++,
                    UserId = 1,
                    CategoryId = limit.Key,
                    LimitValue = limit.Value,
                    PeriodMonth = month,
                    PeriodYear = year,
                    CreatedAt = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc)
                });
            }

            // 2. Receitas (Incomes) para o mês (estudante universitária de 21 anos)
            // Bolsa de Estágio no dia 5
            var stipendDate = new DateTime(year, month, 5, 0, 0, 0, DateTimeKind.Utc);
            if (stipendDate <= today)
            {
                incomes.Add(new Income
                {
                    Id = incomeIdCounter++,
                    UserId = 1,
                    Description = "Bolsa de Estágio - Tech Solutions",
                    Amount = 1500m,
                    TransactionDate = stipendDate,
                    CreatedAt = stipendDate
                });
            }

            // Ajuda de Custo Familiar no dia 10
            var familySupportDate = new DateTime(year, month, 10, 0, 0, 0, DateTimeKind.Utc);
            if (familySupportDate <= today)
            {
                incomes.Add(new Income
                {
                    Id = incomeIdCounter++,
                    UserId = 1,
                    Description = "Ajuda de Custo Familiar",
                    Amount = 500m,
                    TransactionDate = familySupportDate,
                    CreatedAt = familySupportDate
                });
            }

            // Renda extra de aulas particulares em meses alternados no dia 20
            if (month % 2 != 0)
            {
                var extraIncomeDate = new DateTime(year, month, 20, 0, 0, 0, DateTimeKind.Utc);
                if (extraIncomeDate <= today)
                {
                    incomes.Add(new Income
                    {
                        Id = incomeIdCounter++,
                        UserId = 1,
                        Description = "Aula Particular de Programação",
                        Amount = 250m,
                        TransactionDate = extraIncomeDate,
                        CreatedAt = extraIncomeDate
                    });
                }
            }

            // 3. Despesas (Expenses) para o mês
            
            // Moradia: Aluguel da república no dia 5
            var rentDate = new DateTime(year, month, 5, 0, 0, 0, DateTimeKind.Utc);
            if (rentDate <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 6, // Moradia
                    Description = "Aluguel da República",
                    Value = 650m,
                    TransactionDate = rentDate,
                    Observation = "Divisão mensal do aluguel",
                    IsRecurrent = true,
                    Status = ExpenseStatus.Active,
                    CreatedAt = rentDate,
                    UpdatedAt = rentDate
                });
            }

            // Moradia: Divisão de Contas (Luz/Água/Internet) no dia 10
            var billsDate = new DateTime(year, month, 10, 0, 0, 0, DateTimeKind.Utc);
            if (billsDate <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 6, // Moradia
                    Description = "Divisão de Contas (Luz, Água, Internet)",
                    Value = Math.Round(110m + (decimal)(random.NextDouble() * 30), 2),
                    TransactionDate = billsDate,
                    Observation = "Rateio das contas da república",
                    IsRecurrent = false,
                    Status = ExpenseStatus.Active,
                    CreatedAt = billsDate,
                    UpdatedAt = billsDate
                });
            }

            // Alimentação: Supermercado no dia 3
            var groceryDate = new DateTime(year, month, 3, 0, 0, 0, DateTimeKind.Utc);
            if (groceryDate <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 1, // Alimentação
                    Description = "Supermercado - Compras do Mês",
                    Value = Math.Round(220m + (decimal)(random.NextDouble() * 50), 2),
                    TransactionDate = groceryDate,
                    Observation = "Abastecimento básico mensal",
                    IsRecurrent = false,
                    Status = ExpenseStatus.Active,
                    CreatedAt = groceryDate,
                    UpdatedAt = groceryDate
                });
            }

            // Alimentação: Restaurante Universitário (R.U.) no dia 15
            var ruDate = new DateTime(year, month, 15, 0, 0, 0, DateTimeKind.Utc);
            if (ruDate <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 1, // Alimentação
                    Description = "Mensualidade R.U. (Restaurante Universitário)",
                    Value = 80m,
                    TransactionDate = ruDate,
                    Observation = "Almoços e jantares na faculdade",
                    IsRecurrent = true,
                    Status = ExpenseStatus.Active,
                    CreatedAt = ruDate,
                    UpdatedAt = ruDate
                });
            }

            // Alimentação: iFood no dia 8
            var pizzaDate = new DateTime(year, month, 8, 0, 0, 0, DateTimeKind.Utc);
            if (pizzaDate <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 1, // Alimentação
                    Description = "iFood - Pizza com amigos da faculdade",
                    Value = Math.Round(40m + (decimal)(random.NextDouble() * 25), 2),
                    TransactionDate = pizzaDate,
                    Observation = "Confraternização",
                    IsRecurrent = false,
                    Status = ExpenseStatus.Active,
                    CreatedAt = pizzaDate,
                    UpdatedAt = pizzaDate
                });
            }

            // Alimentação: Lanches na cantina no dia 22
            var snackDate = new DateTime(year, month, 22, 0, 0, 0, DateTimeKind.Utc);
            if (snackDate <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 1, // Alimentação
                    Description = "Lanches na Cantina da Faculdade",
                    Value = Math.Round(40m + (decimal)(random.NextDouble() * 30), 2),
                    TransactionDate = snackDate,
                    Observation = "Lanche rápido no intervalo",
                    IsRecurrent = false,
                    Status = ExpenseStatus.Active,
                    CreatedAt = snackDate,
                    UpdatedAt = snackDate
                });
            }

            // Transporte: Recarga passe estudantil no dia 1
            var busPassDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            if (busPassDate <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 2, // Transporte
                    Description = "Recarga Passe Estudantil (Ônibus/Metrô)",
                    Value = 90m,
                    TransactionDate = busPassDate,
                    Observation = "Transporte diário para a universidade",
                    IsRecurrent = true,
                    Status = ExpenseStatus.Active,
                    CreatedAt = busPassDate,
                    UpdatedAt = busPassDate
                });
            }

            // Transporte: Uber/99 no dia 12 e 26
            var uber1Date = new DateTime(year, month, 12, 0, 0, 0, DateTimeKind.Utc);
            if (uber1Date <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 2, // Transporte
                    Description = "Corrida de Aplicativo (Volta da Faculdade)",
                    Value = Math.Round(18m + (decimal)(random.NextDouble() * 15), 2),
                    TransactionDate = uber1Date,
                    Observation = "Retorno à noite por segurança",
                    IsRecurrent = false,
                    Status = ExpenseStatus.Active,
                    CreatedAt = uber1Date,
                    UpdatedAt = uber1Date
                });
            }

            var uber2Date = new DateTime(year, month, 26, 0, 0, 0, DateTimeKind.Utc);
            if (uber2Date <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 2, // Transporte
                    Description = "Corrida de Aplicativo (Final de Semana)",
                    Value = Math.Round(20m + (decimal)(random.NextDouble() * 20), 2),
                    TransactionDate = uber2Date,
                    Observation = "Deslocamento para lazer",
                    IsRecurrent = false,
                    Status = ExpenseStatus.Active,
                    CreatedAt = uber2Date,
                    UpdatedAt = uber2Date
                });
            }

            // Lazer: Netflix/Spotify no dia 14
            var streamingDate = new DateTime(year, month, 14, 0, 0, 0, DateTimeKind.Utc);
            if (streamingDate <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 3, // Lazer
                    Description = "Assinatura Spotify & Netflix (Divisão)",
                    Value = 27.90m,
                    TransactionDate = streamingDate,
                    Observation = "Divisão de contas de entretenimento",
                    IsRecurrent = true,
                    Status = ExpenseStatus.Active,
                    CreatedAt = streamingDate,
                    UpdatedAt = streamingDate
                });
            }

            // Lazer: Cervejada / Festas Universitárias no dia 18
            var partyDate = new DateTime(year, month, 18, 0, 0, 0, DateTimeKind.Utc);
            if (partyDate <= today)
            {
                // Em Maio (month == 5), estoura o orçamento de Lazer (limite de 250m) com uma cervejada maior
                decimal partyValue = (month == 5)
                    ? Math.Round(200m + (decimal)(random.NextDouble() * 50), 2)
                    : Math.Round(70m + (decimal)(random.NextDouble() * 50), 2);

                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 3, // Lazer
                    Description = (month == 5) ? "Ingresso + Consumo Cervejada Universitária" : "Rolê / Festa Universitária",
                    Value = partyValue,
                    TransactionDate = partyDate,
                    Observation = "Integração acadêmica",
                    IsRecurrent = false,
                    Status = ExpenseStatus.Active,
                    CreatedAt = partyDate,
                    UpdatedAt = partyDate
                });
            }

            // Lazer: Cinema/Outros no dia 25
            var leisureDate = new DateTime(year, month, 25, 0, 0, 0, DateTimeKind.Utc);
            if (leisureDate <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 3, // Lazer
                    Description = "Cinema e Shopping (Meia-Entrada)",
                    Value = Math.Round(40m + (decimal)(random.NextDouble() * 40), 2),
                    TransactionDate = leisureDate,
                    Observation = "Descontração no final de semana",
                    IsRecurrent = false,
                    Status = ExpenseStatus.Active,
                    CreatedAt = leisureDate,
                    UpdatedAt = leisureDate
                });
            }

            // Educação: Xerox no dia 8
            var xeroxDate = new DateTime(year, month, 8, 0, 0, 0, DateTimeKind.Utc);
            if (xeroxDate <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 5, // Educação
                    Description = "Cópias e Impressões de Artigos",
                    Value = Math.Round(15m + (decimal)(random.NextDouble() * 20), 2),
                    TransactionDate = xeroxDate,
                    Observation = "Material para aulas e seminários",
                    IsRecurrent = false,
                    Status = ExpenseStatus.Active,
                    CreatedAt = xeroxDate,
                    UpdatedAt = xeroxDate
                });
            }

            // Educação: Livros no dia 15
            var booksDate = new DateTime(year, month, 15, 0, 0, 0, DateTimeKind.Utc);
            if (booksDate <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 5, // Educação
                    Description = "Livro de Referência Acadêmica",
                    Value = Math.Round(60m + (decimal)(random.NextDouble() * 60), 2),
                    TransactionDate = booksDate,
                    Observation = "Leitura obrigatória da disciplina",
                    IsRecurrent = false,
                    Status = ExpenseStatus.Active,
                    CreatedAt = booksDate,
                    UpdatedAt = booksDate
                });
            }

            // Educação: Curso Online no dia 20
            var onlineCourseDate = new DateTime(year, month, 20, 0, 0, 0, DateTimeKind.Utc);
            if (onlineCourseDate <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 5, // Educação
                    Description = "Curso Online - Desenvolvimento Web",
                    Value = 49.90m,
                    TransactionDate = onlineCourseDate,
                    Observation = "Estudo extracurricular",
                    IsRecurrent = false,
                    Status = ExpenseStatus.Active,
                    CreatedAt = onlineCourseDate,
                    UpdatedAt = onlineCourseDate
                });
            }

            // Saúde: Farmácia no dia 16
            var healthDate = new DateTime(year, month, 16, 0, 0, 0, DateTimeKind.Utc);
            if (healthDate <= today)
            {
                expenses.Add(new Expense
                {
                    Id = expenseIdCounter++,
                    UserId = 1,
                    CategoryId = 4, // Saúde
                    Description = "Medicamentos e Higiene Pessoal",
                    Value = Math.Round(30m + (decimal)(random.NextDouble() * 50), 2),
                    TransactionDate = healthDate,
                    Observation = "Cuidados pessoais",
                    IsRecurrent = false,
                    Status = ExpenseStatus.Active,
                    CreatedAt = healthDate,
                    UpdatedAt = healthDate
                });
            }

            // 4. Alertas para o mês mais recente (ou anterior se estourar)
            if (i <= 1)
            {
                var alert1Date = new DateTime(year, month, 27, 0, 0, 0, DateTimeKind.Utc);
                if (alert1Date <= today)
                {
                    alerts.Add(new Alert
                    {
                        Id = alertIdCounter++,
                        UserId = 1,
                        CategoryId = 3, // Lazer
                        Type = AlertType.BudgetExceeded,
                        Title = "Lazer acima do limite",
                        Message = "Seu orçamento de Lazer foi ultrapassado neste mês.",
                        IsRead = i == 1, // Marcar como lido se for do mês anterior
                        CreatedAt = alert1Date,
                        UpdatedAt = alert1Date
                    });
                }

                var alert2Date = new DateTime(year, month, 24, 0, 0, 0, DateTimeKind.Utc);
                if (alert2Date <= today)
                {
                    alerts.Add(new Alert
                    {
                        Id = alertIdCounter++,
                        UserId = 1,
                        CategoryId = 1, // Alimentação
                        Type = AlertType.HighExpense,
                        Title = "Alimentação próximo do limite",
                        Message = "Você já consumiu mais de 80% do limite de Alimentação.",
                        IsRead = i == 1,
                        CreatedAt = alert2Date,
                        UpdatedAt = alert2Date
                    });
                }
            }
        }

        context.Budgets.AddRange(budgets);
        context.Incomes.AddRange(incomes);
        context.Expenses.AddRange(expenses);
        context.Alerts.AddRange(alerts);
        context.SaveChanges();

        // Dados adicionais para o usuário 2 (João) para manter suporte a múltiplos usuários
        var expensesJoao = new List<Expense>
        {
            new Expense
            {
                Id = expenseIdCounter++,
                UserId = 2,
                CategoryId = 1,
                Description = "Almoço no shopping",
                Value = 65m,
                TransactionDate = new DateTime(today.Year, today.Month, 10, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Comida rápida",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = expenseIdCounter++,
                UserId = 2,
                CategoryId = 2,
                Description = "Uber",
                Value = 28m,
                TransactionDate = new DateTime(today.Year, today.Month, 9, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Viagem ao trabalho",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        context.Expenses.AddRange(expensesJoao);
        context.SaveChanges();
    }

    // Helper para hashear senha
    private static string HashPassword(string password)
    {
        // Usar BCrypt ao invés de SHA256 puro para consistência com AuthService
        return BCrypt.Net.BCrypt.HashPassword(password);
    }
}
