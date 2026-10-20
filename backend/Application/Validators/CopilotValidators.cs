using FluentValidation;
using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Validators;

public class SendCopilotMessageValidator : AbstractValidator<SendCopilotMessageRequest>
{
    public SendCopilotMessageValidator()
    {
        RuleFor(x => x.Content).NotEmpty().MaximumLength(2000);
    }
}
