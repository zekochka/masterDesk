using System.ComponentModel.DataAnnotations;

namespace MasterDesk.Api.Dtos;

public sealed record CreateRepairRequestDto(
    [Required] string DeviceType,
    [Required] string BrandModel,
    [Required] string Description,
    [Required] string ContactPhone,
    string? Comment);

public sealed record RepairRequestResponseDto(
    Guid Id, string RequestNumber, Guid ClientId, Guid? MasterId,
    string DeviceType, string BrandModel, string Description, string ContactPhone,
    string? Comment, string Status, DateTime CreatedAt, DateTime? AcceptedAt,
    DateTime? CompletedAt);
