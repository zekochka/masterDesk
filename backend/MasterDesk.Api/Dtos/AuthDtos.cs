using System.ComponentModel.DataAnnotations;

namespace MasterDesk.Api.Dtos;

public sealed record RegisterDto(
    [Required, MaxLength(100)] string Login,
    [Required, MinLength(8)] string Password,
    [Required] string ConfirmPassword);

public sealed record LoginDto([Required] string Login, [Required] string Password);

public sealed record UserProfileDto(
    Guid Id, string Username, string Role, string? FirstName, string? LastName,
    string? Email, string? Phone);

public sealed record AuthResponseDto(string Token, UserProfileDto User);

public sealed record UpdateProfileDto(
    string? FirstName, string? LastName, [EmailAddress] string? Email, string? Phone);
