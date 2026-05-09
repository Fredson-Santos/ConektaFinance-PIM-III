using System.Collections.Generic;

namespace PIM_III_Backend.Domain.Entities;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ColorCode { get; set; } = "#000000";
    public string Icon { get; set; } = "folder";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    public ICollection<Budget> Budgets { get; set; } = new List<Budget>();
}
