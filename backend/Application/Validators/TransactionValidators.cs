using FluentValidation;
using ConektaFinance.Api.Application.Dtos;

namespace ConektaFinance.Api.Application.Validators;

public class CreateTransactionValidator : AbstractValidator<CreateTransactionRequest>
{
    public CreateTransactionValidator()
    {
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Value).GreaterThan(0);
        RuleFor(x => x.TransactionDate).NotEmpty();
        RuleFor(x => x.Observation).MaximumLength(500);
        RuleFor(x => x.PaymentMethod).IsInEnum()
            .When(x => x.PaymentMethod.HasValue);
    }
}

public class UpdateTransactionValidator : AbstractValidator<UpdateTransactionRequest>
{
    public UpdateTransactionValidator()
    {
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Value).GreaterThan(0);
        RuleFor(x => x.TransactionDate).NotEmpty();
        RuleFor(x => x.Observation).MaximumLength(500);
        RuleFor(x => x.PaymentMethod).IsInEnum()
            .When(x => x.PaymentMethod.HasValue);
        RuleFor(x => x.Status).IsInEnum()
            .When(x => x.Status.HasValue);
    }
}
