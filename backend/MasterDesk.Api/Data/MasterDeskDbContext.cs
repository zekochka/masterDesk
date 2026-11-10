using MasterDesk.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MasterDesk.Api.Data;

public sealed class MasterDeskDbContext(DbContextOptions<MasterDeskDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RepairRequest> RepairRequests => Set<RepairRequest>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("citext");

        modelBuilder.Entity<User>(user =>
        {
            user.HasKey(x => x.Id);
            user.Property(x => x.Login).HasColumnType("citext").HasMaxLength(100).IsRequired();
            user.HasIndex(x => x.Login).IsUnique();
            user.Property(x => x.PasswordHash).IsRequired();
            user.Property(x => x.Role).HasConversion<string>().HasMaxLength(20);
            user.Property(x => x.CreatedAt).IsRequired();
        });

        modelBuilder.Entity<RepairRequest>(request =>
        {
            request.HasKey(x => x.Id);
            request.Property(x => x.RequestNumber).HasMaxLength(32).IsRequired();
            request.HasIndex(x => x.RequestNumber).IsUnique();
            request.Property(x => x.DeviceType).HasMaxLength(100).IsRequired();
            request.Property(x => x.BrandModel).HasMaxLength(200).IsRequired();
            request.Property(x => x.Description).IsRequired();
            request.Property(x => x.ContactPhone).HasMaxLength(30).IsRequired();
            request.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            request.HasIndex(x => new { x.ClientId, x.CreatedAt });
            request.HasIndex(x => new { x.Status, x.MasterId });
            request.HasOne(x => x.Client).WithMany(x => x.ClientRequests).HasForeignKey(x => x.ClientId).OnDelete(DeleteBehavior.Restrict);
            request.HasOne(x => x.Master).WithMany(x => x.AssignedRequests).HasForeignKey(x => x.MasterId).OnDelete(DeleteBehavior.Restrict);
        });
    }
}
