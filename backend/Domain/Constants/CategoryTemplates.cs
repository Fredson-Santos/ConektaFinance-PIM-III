using PIM_III_Backend.Domain.Entities;
using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Domain.Constants;

public static class CategoryTemplates
{
    public record Template(string Name, string Description, string ColorCode, string Icon, CategoryKind Kind, int SortOrder);

    public static readonly List<Template> Defaults =
    [
        new("Alimentação", "Restaurantes, supermercados e delivery", "#ef4444", "Utensils", CategoryKind.Expense, 1),
        new("Transporte", "Uber, ônibus e combustível", "#0070f3", "Car", CategoryKind.Expense, 2),
        new("Lazer", "Cinema, viagens e hobbies", "#00cc88", "Film", CategoryKind.Expense, 3),
        new("Moradia", "Aluguel, contas e manutenção", "#f5a623", "Home", CategoryKind.Expense, 4),
        new("Saúde", "Farmácia, planos e consultas", "#e93d82", "HeartPulse", CategoryKind.Expense, 5),
        new("Educação", "Cursos, livros e materiais", "#8e4ec6", "GraduationCap", CategoryKind.Expense, 6),
        new("Outros", "Diversos e não classificados", "#888888", "Tag", CategoryKind.Expense, 7),
        new("Salário", "Remuneração mensal fixa", "#00cc88", "Wallet", CategoryKind.Income, 8),
        new("Investimentos", "Rendimentos e aplicações", "#12b5cb", "LineChart", CategoryKind.Income, 9),
        new("Freelance", "Projetos e trabalhos extras", "#8e4ec6", "Briefcase", CategoryKind.Income, 10),
        new("Dividendos", "Proventos de ações e FIIs", "#f5a623", "PiggyBank", CategoryKind.Income, 11),
        new("Reembolso", "Valores devolvidos e estornos", "#e93d82", "RotateCcw", CategoryKind.Income, 12),
        new("Outras entradas", "Entradas diversas", "#888888", "Landmark", CategoryKind.Income, 13)
    ];

    public static List<Category> CloneForUser(int userId) =>
        Defaults.Select(t => new Category
        {
            UserId = userId,
            Name = t.Name,
            Description = t.Description,
            ColorCode = t.ColorCode,
            Icon = t.Icon,
            Kind = t.Kind,
            IsSystem = true,
            SortOrder = t.SortOrder
        }).ToList();
}
