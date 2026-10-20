using PIM_III_Backend.Domain.Enums;

namespace PIM_III_Backend.Domain.Entities;

public class ImportBatch
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public int DetectedCount { get; set; }
    public int ImportedCount { get; set; }
    public int SkippedDuplicates { get; set; }
    public bool AutoCategorize { get; set; }
    public bool IgnoreDuplicates { get; set; }
    public ImportStatus Status { get; set; } = ImportStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
