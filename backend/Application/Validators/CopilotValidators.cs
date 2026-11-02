using FluentValidation;
using PIM_III_Backend.Application.Dtos;

namespace PIM_III_Backend.Application.Validators;

public class SendCopilotMessageValidator : AbstractValidator<SendCopilotMessageRequest>
{
    private const int MaxImageBase64Length = 7_000_000; // ~5 MB decodificados

    public SendCopilotMessageValidator()
    {
        RuleFor(x => x.Content).MaximumLength(2000);

        RuleFor(x => x.ImageBase64)
            .MaximumLength(MaxImageBase64Length)
            .Matches(@"^(data:image/(jpeg|jpg|png|webp);base64,)?[A-Za-z0-9+/=\s]+$")
            .When(x => !string.IsNullOrWhiteSpace(x.ImageBase64))
            .WithMessage("Imagem deve ser JPEG, PNG ou WebP em base64.");

        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.Content) || !string.IsNullOrWhiteSpace(x.ImageBase64))
            .WithMessage("Escreva uma mensagem ou anexe uma imagem para o assistente.");
    }
}
