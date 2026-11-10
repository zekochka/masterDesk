using System.Security.Claims;
using MasterDesk.Api.Dtos;
using MasterDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MasterDesk.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public sealed class UsersController(IAuthService auth) : ControllerBase
{
    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe(UpdateProfileDto dto, CancellationToken cancellationToken)
    {
        var id = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await auth.UpdateProfileAsync(id, dto.FirstName, dto.LastName, dto.Email, dto.Phone, cancellationToken);
        return user is null ? NotFound(new { error = "Пользователь не найден" }) : Ok(AuthController.Map(user));
    }
}
