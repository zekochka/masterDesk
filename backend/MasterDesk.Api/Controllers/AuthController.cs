using System.Security.Claims;
using MasterDesk.Api.Dtos;
using MasterDesk.Api.Models;
using MasterDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MasterDesk.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService auth) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegisterDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Login) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { error = "Логин и пароль обязательны" });
        if (dto.Password != dto.ConfirmPassword)
            return BadRequest(new { error = "Пароли не совпадают" });
        var user = await auth.RegisterAsync(dto.Login, dto.Password, cancellationToken);
        if (user is null) return Conflict(new { error = "Этот логин уже занят" });
        return CreatedAtAction(nameof(Me), new AuthResponseDto(auth.CreateToken(user), Map(user)));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginDto dto, CancellationToken cancellationToken)
    {
        var user = await auth.LoginAsync(dto.Login, dto.Password, cancellationToken);
        return user is null
            ? Unauthorized(new { error = "Неверный логин или пароль" })
            : Ok(new AuthResponseDto(auth.CreateToken(user), Map(user)));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var user = await auth.GetUserAsync(UserId(), cancellationToken);
        return user is null ? NotFound(new { error = "Пользователь не найден" }) : Ok(Map(user));
    }

    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    internal static UserProfileDto Map(User user) => new(
        user.Id, user.Login, user.Role.ToString(), user.FirstName, user.LastName, user.Email, user.Phone);
}
