using FluentValidation;
using PIM_III_Backend.Application.Dtos.Expenses;

namespace PIM_III_Backend.Application.Validators;

public class CreateExpenseValidator : AbstractValidator<CreateExpenseRequest>
{
    public CreateExpenseValidator()
    {
        RuleFor(x => x.Description).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Value).GreaterThan(0);
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.TransactionDate).NotEmpty();
    }
}
