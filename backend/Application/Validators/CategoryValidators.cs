using FluentValidation;
using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Validators;

public class CreateCategoryValidator : AbstractValidator<CreateCategoryRequest>
{
    public CreateCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(300);
        RuleFor(x => x.ColorCode).NotEmpty().Matches("^#[A-Fa-f0-9]{6}$")
            .WithMessage("Informe a cor no formato hexadecimal, por exemplo #0070f3.");
        RuleFor(x => x.Icon).MaximumLength(40);
        RuleFor(x => x.Kind).IsInEnum();
    }
}

public class UpdateCategoryValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryValidator()
    {
        RuleFor(x => x.Name).MaximumLength(100)
            .When(x => x.Name is not null);
        RuleFor(x => x.Description).MaximumLength(300);
        RuleFor(x => x.ColorCode).Matches("^#[A-Fa-f0-9]{6}$")
            .When(x => x.ColorCode is not null);
        RuleFor(x => x.Icon).MaximumLength(40);
    }
}
