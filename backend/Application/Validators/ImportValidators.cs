using FluentValidation;
using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Validators;

public class ConfirmImportValidator : AbstractValidator<ConfirmImportRequest>
{
    public ConfirmImportValidator()
    {
        RuleFor(x => x.ItemIds).NotEmpty();
        RuleForEach(x => x.ItemIds).GreaterThanOrEqualTo(0);
    }
}
