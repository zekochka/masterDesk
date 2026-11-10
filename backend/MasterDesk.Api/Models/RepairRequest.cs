namespace MasterDesk.Api.Models;

public enum RepairRequestStatus { New, Accepted, Completed }

public sealed class RepairRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string RequestNumber { get; set; }
    public Guid ClientId { get; set; }
    public User Client { get; set; } = null!;
    public Guid? MasterId { get; set; }
    public User? Master { get; set; }
    public required string DeviceType { get; set; }
    public required string BrandModel { get; set; }
    public required string Description { get; set; }
    public required string ContactPhone { get; set; }
    public string? Comment { get; set; }
    public RepairRequestStatus Status { get; set; } = RepairRequestStatus.New;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
