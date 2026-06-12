using Microsoft.EntityFrameworkCore;
using FactoryApp.Domain.Entities;

namespace FactoryApp.Domain;

public class FactoryDbContext : DbContext
{
    public FactoryDbContext(DbContextOptions<FactoryDbContext> options) : base(options)
    {
    }

    public DbSet<Build> Builds { get; set; } = null!;
    public DbSet<Part> Parts { get; set; } = null!;
    public DbSet<TestRun> TestRuns { get; set; } = null!;
    public DbSet<AuthUser> AuthUsers { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("dbo");

        // Build configuration
        modelBuilder.Entity<Build>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.Name).IsRequired().HasMaxLength(256);
            b.Property(x => x.Description).HasMaxLength(1000);
            b.Property(x => x.Status).IsRequired();
            b.Property(x => x.CreatedAt).IsRequired();
            b.Property(x => x.UpdatedAt).IsRequired();

            b.HasMany(x => x.Parts)
                .WithOne(x => x.Build)
                .HasForeignKey(x => x.BuildId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasMany(x => x.TestRuns)
                .WithOne(x => x.Build)
                .HasForeignKey(x => x.BuildId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => x.Status);
            b.HasIndex(x => x.CreatedAt);
        });

        // Part configuration
        modelBuilder.Entity<Part>(p =>
        {
            p.HasKey(x => x.Id);
            p.Property(x => x.BuildId).IsRequired();
            p.Property(x => x.Name).IsRequired().HasMaxLength(256);
            p.Property(x => x.SKU).IsRequired().HasMaxLength(100);
            p.Property(x => x.Quantity).IsRequired();
            p.Property(x => x.CreatedAt).IsRequired();

            p.HasIndex(x => x.BuildId);
            p.HasIndex(x => x.SKU);
        });

        // TestRun configuration
        modelBuilder.Entity<TestRun>(t =>
        {
            t.HasKey(x => x.Id);
            t.Property(x => x.BuildId).IsRequired();
            t.Property(x => x.Status).IsRequired();
            t.Property(x => x.Result).HasMaxLength(2000);
            t.Property(x => x.FileUrl).HasMaxLength(500);
            t.Property(x => x.CompletedAt);
            t.Property(x => x.CreatedAt).IsRequired();
            t.Property(x => x.UpdatedAt).IsRequired();

            t.HasIndex(x => x.BuildId);
            t.HasIndex(x => x.Status);
        });

        // AuthUser configuration
        modelBuilder.Entity<AuthUser>(a =>
        {
            a.HasKey(x => x.Id);
            a.Property(x => x.Email).IsRequired().HasMaxLength(256);
            a.Property(x => x.PasswordHash).IsRequired().HasMaxLength(256);

            a.HasIndex(x => x.Email).IsUnique();
        });
    }
}
