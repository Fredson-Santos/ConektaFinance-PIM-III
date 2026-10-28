using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using PIM_III_Backend.Domain.Constants;
using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Infrastructure.Persistence;

public static class SeedData
{
    public static void Initialize(AppDbContext context)
    {
        context.Database.Migrate();
        DatabaseProgrammability.Apply(context);
        if (context.Users.Any())
            return;

        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1);

        var demo = new User
        {
            FullName = "Usuário Demo",
            DisplayName = "Fred",
            Email = "demo@conektafinance.com",
            Phone = "11987654321",
            Occupation = "Desenvolvedor de Software",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@12345"),
            MonthlyCeiling = 6350m,
            Currency = "BRL",
            CycleStartDay = 1,
            OnboardingCompletedAt = now.AddDays(-200),
            CreatedAt = now.AddDays(-200),
            UpdatedAt = now
        };
        context.Users.Add(demo);
        context.SaveChanges();

        var categories = CategoryTemplates.CloneForUser(demo.Id);
        context.Categories.AddRange(categories);
        context.SaveChanges();
        var cat = categories.ToDictionary(c => c.Name, c => c.Id);

        var budgets = new List<Budget>();
        foreach (var (name, limit) in new[] { ("Alimentação", 1500m), ("Transporte", 600m), ("Lazer", 800m), ("Moradia", 2300m), ("Saúde", 400m) })
        {
            for (var offset = 5; offset >= 0; offset--)
            {
                var period = monthStart.AddMonths(-offset);
                budgets.Add(new Budget
                {
                    UserId = demo.Id,
                    CategoryId = cat[name],
                    LimitValue = limit,
                    PeriodMonth = period.Month,
                    PeriodYear = period.Year
                });
            }
        }
        context.Budgets.AddRange(budgets);

        var transactions = new List<Transaction>();
        void Add(int categoryId, TransactionType type, string description, decimal value, int monthOffset, int day,
            PaymentMethod method, bool recurrent = false)
        {
            var period = monthStart.AddMonths(-monthOffset);
            var safeDay = Math.Min(day, DateTime.DaysInMonth(period.Year, period.Month));
            var date = new DateTime(period.Year, period.Month, safeDay, 12, 0, 0);
            if (date > now)
                return;
            transactions.Add(new Transaction
            {
                UserId = demo.Id,
                CategoryId = categoryId,
                Type = type,
                Description = description,
                Value = value,
                TransactionDate = date,
                PaymentMethod = method,
                IsRecurrent = recurrent,
                Source = TransactionSource.Manual,
                CreatedAt = date,
                UpdatedAt = date
            });
        }

        void AddDaysAgo(int categoryId, TransactionType type, string description, decimal value, int daysAgo,
            PaymentMethod method)
        {
            var date = now.Date.AddDays(-daysAgo).AddHours(12);
            if (date > now)
                return;
            transactions.Add(new Transaction
            {
                UserId = demo.Id,
                CategoryId = categoryId,
                Type = type,
                Description = description,
                Value = value,
                TransactionDate = date,
                PaymentMethod = method,
                Source = TransactionSource.Manual,
                CreatedAt = date,
                UpdatedAt = date
            });
        }

        for (var offset = 5; offset >= 1; offset--)
        {
            Add(cat["Salário"], TransactionType.Income, "Salário Tech Solutions", 5200m, offset, 5, PaymentMethod.Transferencia);
            if (offset % 2 == 0)
                Add(cat["Freelance"], TransactionType.Income, "Projeto freelance", 850m, offset, 12, PaymentMethod.Pix);
            Add(cat["Moradia"], TransactionType.Expense, "Aluguel do apartamento", 1450m, offset, 8, PaymentMethod.Boleto, true);
            Add(cat["Moradia"], TransactionType.Expense, "Condomínio", 420m, offset, 10, PaymentMethod.Boleto);
            Add(cat["Moradia"], TransactionType.Expense, "Energia elétrica", 125m + offset * 7.4m, offset, 15, PaymentMethod.Debito);
            Add(cat["Alimentação"], TransactionType.Expense, "Supermercado mensal", 215m + offset * 11.3m, offset, 6, PaymentMethod.Cartao);
            Add(cat["Alimentação"], TransactionType.Expense, "iFood jantar", 48.9m + offset * 3.2m, offset, 13, PaymentMethod.Pix);
            Add(cat["Transporte"], TransactionType.Expense, "Uber corrida", 32.90m, offset, 9, PaymentMethod.Pix);
            Add(cat["Transporte"], TransactionType.Expense, "Recarga bilhete único", 24.50m, offset, 21, PaymentMethod.Pix);
            Add(cat["Lazer"], TransactionType.Expense, "Assinatura de streaming", 39.90m, offset, 20, PaymentMethod.Cartao, true);
            Add(cat["Saúde"], TransactionType.Expense, "Farmácia", 89.90m, offset, 17, PaymentMethod.Pix);
        }

        Add(cat["Salário"], TransactionType.Income, "Salário Tech Solutions", 5200m, 0, 5, PaymentMethod.Transferencia);
        Add(cat["Freelance"], TransactionType.Income, "Landing page para cliente", 850m, 0, 12, PaymentMethod.Pix);
        Add(cat["Moradia"], TransactionType.Expense, "Aluguel do apartamento", 1450m, 0, 8, PaymentMethod.Boleto, true);
        Add(cat["Moradia"], TransactionType.Expense, "Condomínio", 420m, 0, 10, PaymentMethod.Boleto);
        Add(cat["Moradia"], TransactionType.Expense, "Energia elétrica", 160m, 0, 15, PaymentMethod.Debito);

        Add(cat["Alimentação"], TransactionType.Expense, "Supermercado mensal", 320m, 0, 6, PaymentMethod.Cartao);
        AddDaysAgo(cat["Alimentação"], TransactionType.Expense, "Feira do mês", 210m, 6, PaymentMethod.Dinheiro);
        AddDaysAgo(cat["Alimentação"], TransactionType.Expense, "Delivery de pizza", 89.90m, 2, PaymentMethod.Pix);
        AddDaysAgo(cat["Alimentação"], TransactionType.Expense, "Restaurante almoço", 98.70m, 4, PaymentMethod.Cartao);
        AddDaysAgo(cat["Alimentação"], TransactionType.Expense, "Padaria pão de queijo", 24.50m, 1, PaymentMethod.Dinheiro);
        AddDaysAgo(cat["Alimentação"], TransactionType.Expense, "Restaurante jantar", 145m, 5, PaymentMethod.Cartao);
        AddDaysAgo(cat["Alimentação"], TransactionType.Expense, "Café especial", 58m, 0, PaymentMethod.Pix);

        AddDaysAgo(cat["Transporte"], TransactionType.Expense, "Uber reunião", 32.90m, 1, PaymentMethod.Pix);
        AddDaysAgo(cat["Transporte"], TransactionType.Expense, "Combustível", 180m, 3, PaymentMethod.Cartao);

        Add(cat["Lazer"], TransactionType.Expense, "Assinatura de streaming", 39.90m, 0, 20, PaymentMethod.Cartao, true);
        AddDaysAgo(cat["Lazer"], TransactionType.Expense, "Cinema com amigos", 85m, 4, PaymentMethod.Cartao);
        AddDaysAgo(cat["Lazer"], TransactionType.Expense, "Bar do fim de semana", 120m, 3, PaymentMethod.Pix);
        AddDaysAgo(cat["Lazer"], TransactionType.Expense, "Show festival", 210m, 2, PaymentMethod.Cartao);
        AddDaysAgo(cat["Lazer"], TransactionType.Expense, "Jogo digital", 95m, 5, PaymentMethod.Cartao);
        AddDaysAgo(cat["Lazer"], TransactionType.Expense, "Parque aquático", 280m, 1, PaymentMethod.Pix);

        Add(cat["Saúde"], TransactionType.Expense, "Farmácia vitaminas", 89.90m, 0, 17, PaymentMethod.Pix);
        Add(cat["Educação"], TransactionType.Expense, "Curso online", 189.90m, 0, 14, PaymentMethod.Cartao);
        context.Transactions.AddRange(transactions);

        string Dedup(int categoryId, string suffix) => $"cat:{categoryId}:{now.Year}-{now.Month:D2}:{suffix}";
        var alerts = new List<Alert>
        {
            new()
            {
                UserId = demo.Id, Type = AlertType.CategoryLimit, CategoryId = cat["Moradia"],
                Title = "Moradia — 88% do teto", Message = "Atenção ao limite restante deste mês.",
                DedupKey = Dedup(cat["Moradia"], "limit"), CreatedAt = now.AddDays(-1), UpdatedAt = now.AddDays(-1)
            },
            new()
            {
                UserId = demo.Id, Type = AlertType.CategoryLimit, CategoryId = cat["Alimentação"],
                Title = "Alimentação — 83% usado", Message = "Restam R$ 250,00 até o fechamento.",
                DedupKey = Dedup(cat["Alimentação"], "limit"), CreatedAt = now.AddDays(-1), UpdatedAt = now.AddDays(-1)
            },
            new()
            {
                UserId = demo.Id, Type = AlertType.BudgetExceeded, CategoryId = cat["Lazer"],
                Title = "Lazer acima do limite", Message = "Orçamento excedido em R$ 29,90.",
                DedupKey = Dedup(cat["Lazer"], "exceeded"), CreatedAt = now.AddDays(-1), UpdatedAt = now.AddDays(-1)
            }
        };
        context.Alerts.AddRange(alerts);
        context.SaveChanges();
    }
}
