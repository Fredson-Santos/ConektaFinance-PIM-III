using FluentValidation;
using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Validators;

public class BudgetUpsertValidator : AbstractValidator<BudgetUpsertRequest>
{
    public BudgetUpsertValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.LimitValue).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Month).InclusiveBetween(1, 12);
        RuleFor(x => x.Year).GreaterThanOrEqualTo(2020);
    }
}
