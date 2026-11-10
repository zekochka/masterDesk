using System.Security.Claims;
using MasterDesk.Api.Dtos;
using MasterDesk.Api.Models;
using MasterDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MasterDesk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/requests")]
public sealed class RequestsController(IRepairRequestService requests) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = nameof(UserRole.User))]
    public async Task<IActionResult> Create(CreateRepairRequestDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.DeviceType) || string.IsNullOrWhiteSpace(dto.BrandModel) ||
            string.IsNullOrWhiteSpace(dto.Description) || string.IsNullOrWhiteSpace(dto.ContactPhone))
            return BadRequest(new { error = "Заполните обязательные поля заявки" });
        var request = await requests.CreateAsync(UserId(), dto.DeviceType, dto.BrandModel, dto.Description, dto.ContactPhone, dto.Comment, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = request.Id }, Map(request));
    }

    [HttpGet("me")]
    [Authorize(Roles = nameof(UserRole.User))]
    public async Task<IActionResult> Mine(CancellationToken cancellationToken) =>
        Ok((await requests.GetMineAsync(UserId(), cancellationToken)).Select(Map));

    [HttpGet("{id}")]
    [Authorize(Roles = nameof(UserRole.User))]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var request = await requests.GetMineByIdAsync(UserId(), id, cancellationToken);
        if (request is not null) return Ok(Map(request));
        return await requests.ExistsAsync(id, cancellationToken)
            ? Forbid() : NotFound(new { error = "Заявка не найдена" });
    }

    [HttpGet("available")]
    [Authorize(Roles = nameof(UserRole.Master))]
    public async Task<IActionResult> Available(CancellationToken cancellationToken) =>
        Ok((await requests.GetAvailableAsync(cancellationToken)).Select(Map));

    [HttpGet("assigned")]
    [Authorize(Roles = nameof(UserRole.Master))]
    public async Task<IActionResult> Assigned(CancellationToken cancellationToken) =>
        Ok((await requests.GetAssignedAsync(UserId(), cancellationToken)).Select(Map));

    [HttpPatch("{id}/accept")]
    [Authorize(Roles = nameof(UserRole.Master))]
    public async Task<IActionResult> Accept(Guid id, CancellationToken cancellationToken)
    {
        var result = await requests.AcceptAsync(id, UserId(), cancellationToken);
        return result switch
        {
            RequestActionResult.Success => Ok(new { message = "Заявка принята" }),
            RequestActionResult.NotFound => NotFound(new { error = "Заявка не найдена" }),
            _ => Conflict(new { error = "Заявка уже принята" })
        };
    }

    [HttpPatch("{id}/complete")]
    [Authorize(Roles = nameof(UserRole.Master))]
    public async Task<IActionResult> Complete(Guid id, CancellationToken cancellationToken)
    {
        var result = await requests.CompleteAsync(id, UserId(), cancellationToken);
        return result switch
        {
            RequestActionResult.Success => Ok(new { message = "Ремонт завершён" }),
            RequestActionResult.NotFound => NotFound(new { error = "Заявка не найдена" }),
            RequestActionResult.Forbidden => StatusCode(403, new { error = "Заявка назначена другому мастеру" }),
            _ => Conflict(new { error = "Заявку нельзя завершить в текущем статусе" })
        };
    }

    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static RepairRequestResponseDto Map(RepairRequest request) => new(
        request.Id, request.RequestNumber, request.ClientId, request.MasterId,
        request.DeviceType, request.BrandModel, request.Description, request.ContactPhone,
        request.Comment, request.Status.ToString().ToLowerInvariant(), request.CreatedAt,
        request.AcceptedAt, request.CompletedAt);
}
