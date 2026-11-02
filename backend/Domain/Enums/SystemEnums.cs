namespace PIM_III_Backend.Domain.Enums;

public enum AlertType
{
    BudgetExceeded = 0,
    CategoryLimit = 1,
    HighExpense = 2
}

public enum ChatRole
{
    User = 0,
    Assistant = 1
}

public enum ChatChannel
{
    Web = 0,
    WhatsApp = 1
}

public enum OtpPurpose
{
    Login = 0
}

public enum ImportStatus
{
    Pending = 0,
    Confirmed = 1,
    Failed = 2
}
