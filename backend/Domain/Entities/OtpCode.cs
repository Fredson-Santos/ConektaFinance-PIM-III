using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Domain.Entities;

public class OtpCode
{
    public int Id { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string CodeHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? ConsumedAt { get; set; }
    public int Attempts { get; set; }
    public OtpPurpose Purpose { get; set; } = OtpPurpose.Login;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
