using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MasterDesk.Api.Data;
using MasterDesk.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

namespace MasterDesk.Api.Services;

public interface IAuthService
{
    Task<User?> RegisterAsync(string login, string password, CancellationToken cancellationToken);
    Task<User?> LoginAsync(string login, string password, CancellationToken cancellationToken);
    Task<User?> GetUserAsync(Guid id, CancellationToken cancellationToken);
    Task<User?> UpdateProfileAsync(Guid id, string? firstName, string? lastName, string? email, string? phone, CancellationToken cancellationToken);
    string CreateToken(User user);
}

public sealed class AuthService(MasterDeskDbContext db, IPasswordHasher<User> hasher, IConfiguration configuration) : IAuthService
{
    public async Task<User?> RegisterAsync(string login, string password, CancellationToken cancellationToken)
    {
        login = login.Trim();
        if (await db.Users.AnyAsync(x => x.Login == login, cancellationToken)) return null;

        var user = new User { Login = login, PasswordHash = string.Empty };
        user.PasswordHash = hasher.HashPassword(user, password);
        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return user;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return null;
        }
    }

    public async Task<User?> LoginAsync(string login, string password, CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Login == login.Trim(), cancellationToken);
        return user is not null && hasher.VerifyHashedPassword(user, user.PasswordHash, password) != PasswordVerificationResult.Failed
            ? user : null;
    }

    public Task<User?> GetUserAsync(Guid id, CancellationToken cancellationToken) =>
        db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<User?> UpdateProfileAsync(Guid id, string? firstName, string? lastName, string? email, string? phone, CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (user is null) return null;
        user.FirstName = Clean(firstName);
        user.LastName = Clean(lastName);
        user.Email = Clean(email);
        user.Phone = Clean(phone);
        await db.SaveChangesAsync(cancellationToken);
        return user;
    }

    public string CreateToken(User user)
    {
        var key = configuration["Jwt:Key"]!;
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Login),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            ],
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
