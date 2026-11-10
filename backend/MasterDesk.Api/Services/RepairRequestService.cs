using MasterDesk.Api.Data;
using MasterDesk.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MasterDesk.Api.Services;

public enum RequestActionResult { Success, NotFound, Forbidden, Conflict }

public interface IRepairRequestService
{
    Task<RepairRequest> CreateAsync(Guid clientId, string deviceType, string brandModel, string description, string contactPhone, string? comment, CancellationToken cancellationToken);
    Task<List<RepairRequest>> GetMineAsync(Guid clientId, CancellationToken cancellationToken);
    Task<RepairRequest?> GetMineByIdAsync(Guid clientId, Guid id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken);
    Task<List<RepairRequest>> GetAvailableAsync(CancellationToken cancellationToken);
    Task<List<RepairRequest>> GetAssignedAsync(Guid masterId, CancellationToken cancellationToken);
    Task<RequestActionResult> AcceptAsync(Guid id, Guid masterId, CancellationToken cancellationToken);
    Task<RequestActionResult> CompleteAsync(Guid id, Guid masterId, CancellationToken cancellationToken);
}

public sealed class RepairRequestService(MasterDeskDbContext db) : IRepairRequestService
{
    public async Task<RepairRequest> CreateAsync(Guid clientId, string deviceType, string brandModel, string description, string contactPhone, string? comment, CancellationToken cancellationToken)
    {
        var id = Guid.NewGuid();
        var request = new RepairRequest
        {
            Id = id,
            RequestNumber = $"MD-{DateTime.UtcNow:yyyy}-{id.ToString("N")[..12].ToUpperInvariant()}",
            ClientId = clientId,
            DeviceType = deviceType.Trim(),
            BrandModel = brandModel.Trim(),
            Description = description.Trim(),
            ContactPhone = contactPhone.Trim(),
            Comment = string.IsNullOrWhiteSpace(comment) ? null : comment.Trim()
        };
        db.RepairRequests.Add(request);
        await db.SaveChangesAsync(cancellationToken);
        return request;
    }

    public Task<List<RepairRequest>> GetMineAsync(Guid clientId, CancellationToken cancellationToken) =>
        db.RepairRequests.AsNoTracking().Where(x => x.ClientId == clientId)
            .OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);

    public Task<RepairRequest?> GetMineByIdAsync(Guid clientId, Guid id, CancellationToken cancellationToken) =>
        db.RepairRequests.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.ClientId == clientId, cancellationToken);

    public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken) =>
        db.RepairRequests.AnyAsync(x => x.Id == id, cancellationToken);

    public Task<List<RepairRequest>> GetAvailableAsync(CancellationToken cancellationToken) =>
        db.RepairRequests.AsNoTracking().Where(x => x.Status == RepairRequestStatus.New && x.MasterId == null)
            .OrderBy(x => x.CreatedAt).ToListAsync(cancellationToken);

    public Task<List<RepairRequest>> GetAssignedAsync(Guid masterId, CancellationToken cancellationToken) =>
        db.RepairRequests.AsNoTracking().Where(x => x.MasterId == masterId)
            .OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);

    public async Task<RequestActionResult> AcceptAsync(Guid id, Guid masterId, CancellationToken cancellationToken)
    {
        var updated = await db.RepairRequests
            .Where(x => x.Id == id && x.Status == RepairRequestStatus.New && x.MasterId == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.Status, RepairRequestStatus.Accepted)
                .SetProperty(x => x.MasterId, masterId)
                .SetProperty(x => x.AcceptedAt, DateTime.UtcNow), cancellationToken);
        if (updated == 1) return RequestActionResult.Success;
        return await ExistsAsync(id, cancellationToken) ? RequestActionResult.Conflict : RequestActionResult.NotFound;
    }

    public async Task<RequestActionResult> CompleteAsync(Guid id, Guid masterId, CancellationToken cancellationToken)
    {
        var updated = await db.RepairRequests
            .Where(x => x.Id == id && x.MasterId == masterId && x.Status == RepairRequestStatus.Accepted)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.Status, RepairRequestStatus.Completed)
                .SetProperty(x => x.CompletedAt, DateTime.UtcNow), cancellationToken);
        if (updated == 1) return RequestActionResult.Success;
        var request = await db.RepairRequests.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (request is null) return RequestActionResult.NotFound;
        return request.MasterId != masterId ? RequestActionResult.Forbidden : RequestActionResult.Conflict;
    }
}
