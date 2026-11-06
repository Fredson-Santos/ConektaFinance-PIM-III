using FluentValidation;
using ConektaFinance.Api.Application.Dtos;

namespace ConektaFinance.Api.Application.Validators;

public class ConfirmImportValidator : AbstractValidator<ConfirmImportRequest>
{
    public ConfirmImportValidator()
    {
        RuleFor(x => x.ItemIds).NotEmpty();
        RuleForEach(x => x.ItemIds).GreaterThanOrEqualTo(0);
    }
}
