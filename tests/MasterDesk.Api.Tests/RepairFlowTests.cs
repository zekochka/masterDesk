using MasterDesk.Api.Data;
using MasterDesk.Api.Models;
using MasterDesk.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NUnit.Framework;

namespace MasterDesk.Api.Tests;

public class RepairFlowTests
{
    private SqliteConnection connection = null!;
    private MasterDeskDbContext db = null!;

    [SetUp]
    public async Task SetUp()
    {
        connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        db = new MasterDeskDbContext(new DbContextOptionsBuilder<MasterDeskDbContext>().UseSqlite(connection).Options);
        await db.Database.EnsureCreatedAsync();
    }

    [TearDown]
    public async Task TearDown()
    {
        await db.DisposeAsync();
        await connection.DisposeAsync();
    }

    [Test]
    public async Task Registration_HashesPassword_AndCreatesOnlyUserRole()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "test-only-key-with-at-least-32-bytes",
            ["Jwt:Issuer"] = "MasterDesk.Api",
            ["Jwt:Audience"] = "MasterDesk.Frontend"
        }).Build();
        var auth = new AuthService(db, new PasswordHasher<User>(), configuration);

        var user = await auth.RegisterAsync("client", "password123", CancellationToken.None);

        Assert.That(user, Is.Not.Null);
        Assert.Multiple(() =>
        {
            Assert.That(user!.Role, Is.EqualTo(UserRole.User));
            Assert.That(user.PasswordHash, Is.Not.EqualTo("password123"));
        });
        Assert.That(await auth.LoginAsync("client", "bad-password", CancellationToken.None), Is.Null);
        Assert.That(await auth.LoginAsync("client", "password123", CancellationToken.None), Is.Not.Null);
        Assert.That(await auth.RegisterAsync("client", "password123", CancellationToken.None), Is.Null);
    }

    [Test]
    public async Task Request_CanOnlyBeAcceptedOnce_AndCompletedByAssignedMaster()
    {
        var client = new User { Login = "client", PasswordHash = "test" };
        var otherClient = new User { Login = "other", PasswordHash = "test" };
        var master = new User { Login = "master", PasswordHash = "test", Role = UserRole.Master };
        var otherMaster = new User { Login = "other-master", PasswordHash = "test", Role = UserRole.Master };
        db.Users.AddRange(client, otherClient, master, otherMaster);
        await db.SaveChangesAsync();
        var service = new RepairRequestService(db);

        var request = await service.CreateAsync(client.Id, "Ноутбук", "ThinkPad", "Не включается", "+77000000000", null, CancellationToken.None);
        Assert.Multiple(() =>
        {
            Assert.That(request.Status, Is.EqualTo(RepairRequestStatus.New));
            Assert.That(request.MasterId, Is.Null);
            Assert.That(request.AcceptedAt, Is.Null);
        });
        Assert.That(await service.GetMineByIdAsync(otherClient.Id, request.Id, CancellationToken.None), Is.Null);
        Assert.That(await service.GetMineAsync(client.Id, CancellationToken.None), Has.Count.EqualTo(1));
        Assert.That(await service.GetAvailableAsync(CancellationToken.None), Has.Count.EqualTo(1));

        Assert.That(await service.AcceptAsync(request.Id, master.Id, CancellationToken.None), Is.EqualTo(RequestActionResult.Success));
        Assert.That(await service.AcceptAsync(request.Id, otherMaster.Id, CancellationToken.None), Is.EqualTo(RequestActionResult.Conflict));
        Assert.That(await service.GetAvailableAsync(CancellationToken.None), Is.Empty);
        Assert.That(await service.GetAssignedAsync(master.Id, CancellationToken.None), Has.Count.EqualTo(1));
        Assert.That(await service.CompleteAsync(request.Id, otherMaster.Id, CancellationToken.None), Is.EqualTo(RequestActionResult.Forbidden));
        Assert.That(await service.CompleteAsync(request.Id, master.Id, CancellationToken.None), Is.EqualTo(RequestActionResult.Success));
        Assert.That(await service.CompleteAsync(request.Id, master.Id, CancellationToken.None), Is.EqualTo(RequestActionResult.Conflict));

        var completed = await service.GetMineByIdAsync(client.Id, request.Id, CancellationToken.None);
        Assert.Multiple(() =>
        {
            Assert.That(completed!.Status, Is.EqualTo(RepairRequestStatus.Completed));
            Assert.That(completed.AcceptedAt, Is.Not.Null);
            Assert.That(completed.CompletedAt, Is.Not.Null);
        });
    }
}
