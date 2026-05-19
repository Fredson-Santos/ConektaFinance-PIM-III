using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using System.Security.Cryptography;
using System.Text;

namespace PIM_III_Backend.Infrastructure.Persistence;

public static class SeedData
{
    public static void Initialize(AppDbContext context)
    {
        // Garantir que o banco existe
        context.Database.EnsureCreated();

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
                FullName = "Usuário Teste",
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
            }
        };

        context.Users.AddRange(users);
        context.SaveChanges();

        // Criar orçamentos para as categorias
        var budgets = new List<Budget>
        {
            new Budget { Id = 1, UserId = 1, CategoryId = 1, LimitValue = 700m, PeriodMonth = 5, PeriodYear = 2026, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Budget { Id = 2, UserId = 1, CategoryId = 2, LimitValue = 300m, PeriodMonth = 5, PeriodYear = 2026, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Budget { Id = 3, UserId = 1, CategoryId = 3, LimitValue = 250m, PeriodMonth = 5, PeriodYear = 2026, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Budget { Id = 4, UserId = 1, CategoryId = 4, LimitValue = 400m, PeriodMonth = 5, PeriodYear = 2026, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Budget { Id = 5, UserId = 1, CategoryId = 6, LimitValue = 1500m, PeriodMonth = 5, PeriodYear = 2026, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        context.Budgets.AddRange(budgets);
        context.SaveChanges();

        // Criar despesas de exemplo para o usuário 1
        var expenses = new List<Expense>
        {
            new Expense
            {
                Id = 1,
                UserId = 1,
                CategoryId = 6,
                Description = "Aluguel",
                Value = 1500m,
                TransactionDate = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Aluguel do apartamento",
                IsRecurrent = true,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 2,
                UserId = 1,
                CategoryId = 1,
                Description = "Supermercado Extra",
                Value = 187.50m,
                TransactionDate = new DateTime(2026, 5, 12, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Compras da semana",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 3,
                UserId = 1,
                CategoryId = 2,
                Description = "Uber — reunião cliente",
                Value = 34m,
                TransactionDate = new DateTime(2026, 5, 11, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Ida e volta ao cliente",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 4,
                UserId = 1,
                CategoryId = 3,
                Description = "Cinema e jantar",
                Value = 120m,
                TransactionDate = new DateTime(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Sessão 19:30 + restaurante",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 5,
                UserId = 1,
                CategoryId = 4,
                Description = "Farmácia São João",
                Value = 56.80m,
                TransactionDate = new DateTime(2026, 5, 9, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Medicamentos diversos",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 6,
                UserId = 1,
                CategoryId = 1,
                Description = "iFood — pizza",
                Value = 67.90m,
                TransactionDate = new DateTime(2026, 5, 8, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Pizza com refrigerante",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 7,
                UserId = 1,
                CategoryId = 1,
                Description = "Restaurante Barbieri",
                Value = 89.50m,
                TransactionDate = new DateTime(2026, 5, 7, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Almoço com colegas",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 8,
                UserId = 1,
                CategoryId = 2,
                Description = "Combustível",
                Value = 220m,
                TransactionDate = new DateTime(2026, 5, 6, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Abastecimento do carro",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 9,
                UserId = 1,
                CategoryId = 3,
                Description = "Ingresso de jogo",
                Value = 150m,
                TransactionDate = new DateTime(2026, 5, 5, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Jogo da série A",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 10,
                UserId = 1,
                CategoryId = 1,
                Description = "Café da manhã",
                Value = 35m,
                TransactionDate = new DateTime(2026, 5, 4, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Café e pão na padaria",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 11,
                UserId = 1,
                CategoryId = 3,
                Description = "Jogo no Switch",
                Value = 250m,
                TransactionDate = new DateTime(2026, 5, 3, 0, 0, 0, DateTimeKind.Utc),
                Observation = "The Legend of Zelda",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 12,
                UserId = 1,
                CategoryId = 4,
                Description = "Dentista",
                Value = 350m,
                TransactionDate = new DateTime(2026, 5, 2, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Limpeza e restauração",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 13,
                UserId = 1,
                CategoryId = 1,
                Description = "Padaria da esquina",
                Value = 42.30m,
                TransactionDate = new DateTime(2026, 4, 30, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Pão francês e biscoitos",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 14,
                UserId = 1,
                CategoryId = 2,
                Description = "Metro",
                Value = 5m,
                TransactionDate = new DateTime(2026, 4, 29, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Passagem de metrô",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 15,
                UserId = 1,
                CategoryId = 3,
                Description = "Karaokê com amigos",
                Value = 85m,
                TransactionDate = new DateTime(2026, 4, 28, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Bebidas e aluguel do espaço",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 16,
                UserId = 1,
                CategoryId = 1,
                Description = "Delivery - burguer",
                Value = 62.50m,
                TransactionDate = new DateTime(2026, 4, 27, 0, 0, 0, DateTimeKind.Utc),
                Observation = "2 lanches + batata",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 17,
                UserId = 1,
                CategoryId = 5,
                Description = "Curso online - Python",
                Value = 199m,
                TransactionDate = new DateTime(2026, 4, 26, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Udemy - 50 horas de conteúdo",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 18,
                UserId = 1,
                CategoryId = 2,
                Description = "Passagem aérea",
                Value = 650m,
                TransactionDate = new DateTime(2026, 4, 25, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Ida e volta São Paulo - Rio",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 19,
                UserId = 1,
                CategoryId = 1,
                Description = "Happy hour",
                Value = 78.90m,
                TransactionDate = new DateTime(2026, 4, 24, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Bebidas com colegas",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 20,
                UserId = 1,
                CategoryId = 3,
                Description = "Show de rock",
                Value = 180m,
                TransactionDate = new DateTime(2026, 4, 23, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Ingresso + estacionamento",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 21,
                UserId = 1,
                CategoryId = 4,
                Description = "Medicamento de controle",
                Value = 125.60m,
                TransactionDate = new DateTime(2026, 4, 22, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Prescrição médica",
                IsRecurrent = true,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 22,
                UserId = 1,
                CategoryId = 1,
                Description = "Açougue",
                Value = 95m,
                TransactionDate = new DateTime(2026, 4, 21, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Carnes diversas",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 23,
                UserId = 1,
                CategoryId = 2,
                Description = "Manutenção do carro",
                Value = 320m,
                TransactionDate = new DateTime(2026, 4, 20, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Troca de óleo e filtro",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 24,
                UserId = 1,
                CategoryId = 3,
                Description = "Livro de ficção científica",
                Value = 65m,
                TransactionDate = new DateTime(2026, 4, 19, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Duna - Frank Herbert",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        context.Expenses.AddRange(expenses);
        context.SaveChanges();

        // Criar alertas
        var alerts = new List<Alert>
        {
            new Alert
            {
                Id = 1,
                UserId = 1,
                CategoryId = 3,
                Type = AlertType.BudgetExceeded,
                Title = "Lazer acima do limite",
                Message = "Orçamento excedido em R$ 60,00",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Alert
            {
                Id = 2,
                UserId = 1,
                CategoryId = 1,
                Type = AlertType.HighExpense,
                Title = "Alimentação — 74% usado",
                Message = "Restam R$ 180 até o fim do mês",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Alert
            {
                Id = 3,
                UserId = 1,
                CategoryId = 6,
                Type = AlertType.CategoryLimit,
                Title = "Moradia — 87% do orçamento",
                Message = "Cuidado para não ultrapassar o limite",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        context.Alerts.AddRange(alerts);
        context.SaveChanges();

        // Dados para usuário 2 (João)
        var expensesJoao = new List<Expense>
        {
            new Expense
            {
                Id = 25,
                UserId = 2,
                CategoryId = 1,
                Description = "Almoço no shopping",
                Value = 65m,
                TransactionDate = new DateTime(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc),
                Observation = "Comida rápida",
                IsRecurrent = false,
                Status = ExpenseStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Expense
            {
                Id = 26,
                UserId = 2,
                CategoryId = 2,
                Description = "Uber",
                Value = 28m,
                TransactionDate = new DateTime(2026, 5, 9, 0, 0, 0, DateTimeKind.Utc),
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
        using (var sha256 = SHA256.Create())
        {
            var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hash);
        }
    }
}
