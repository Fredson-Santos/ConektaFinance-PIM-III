using FluentValidation;
using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Validators;

public class UpdateProfileValidator : AbstractValidator<UpdateProfileRequest>
{
    public UpdateProfileValidator()
    {
        RuleFor(x => x.FullName).MaximumLength(255)
            .When(x => x.FullName is not null);
        RuleFor(x => x.DisplayName).MaximumLength(120);
        RuleFor(x => x.Phone).MaximumLength(20);
        RuleFor(x => x.Cpf).MaximumLength(14);
        RuleFor(x => x.Occupation).MaximumLength(120);
    }
}

public class CompleteOnboardingValidator : AbstractValidator<CompleteOnboardingRequest>
{
    public CompleteOnboardingValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MinimumLength(2).MaximumLength(255);
        RuleFor(x => x.DisplayName).MaximumLength(120);
        RuleFor(x => x.MonthlyCeiling).GreaterThan(0).LessThanOrEqualTo(10_000_000);
    }
}

public class ChangePasswordValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8).MaximumLength(100);
    }
}

public class UpdatePreferencesValidator : AbstractValidator<UpdatePreferencesRequest>
{
    public UpdatePreferencesValidator()
    {
        RuleFor(x => x.MonthlyCeiling).GreaterThanOrEqualTo(0)
            .When(x => x.MonthlyCeiling.HasValue);
        RuleFor(x => x.Currency).MaximumLength(3)
            .When(x => x.Currency is not null);
        RuleFor(x => x.CycleStartDay).InclusiveBetween(1, 28)
            .When(x => x.CycleStartDay.HasValue);
    }
}
