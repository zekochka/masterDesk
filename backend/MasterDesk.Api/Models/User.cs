namespace MasterDesk.Api.Models;

public enum UserRole { Admin, Manager, Master, User }

public sealed class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Login { get; set; }
    public required string PasswordHash { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public UserRole Role { get; set; } = UserRole.User;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<RepairRequest> ClientRequests { get; set; } = [];
    public ICollection<RepairRequest> AssignedRequests { get; set; } = [];
}
