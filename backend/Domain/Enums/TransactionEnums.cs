namespace PIM_III_Backend.Domain.Enums;

public enum CategoryKind
{
    Expense = 0,
    Income = 1
}

public enum TransactionType
{
    Expense = 0,
    Income = 1
}

public enum TransactionStatus
{
    Active = 0,
    Cancelled = 1
}

public enum TransactionSource
{
    Manual = 0,
    Import = 1,
    Copilot = 2
}

public enum PaymentMethod
{
    Cartao = 0,
    Pix = 1,
    Boleto = 2,
    Debito = 3,
    Dinheiro = 4,
    Transferencia = 5,
    Outro = 6
}
