using FactoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.Domain.TestFixtures;

/// <summary>
/// Programmatic seeding of test fixtures for HTTP Client testing.
/// Provides deterministic test data (users, builds, parts, test runs).
///
/// Usage:
///   if (isDevelopment)
///     await FixtureSeeder.SeedAllAsync(dbContext);
/// </summary>
public class FixtureSeeder
{
    // Fixed GUIDs for consistent test data across runs
    private static readonly Dictionary<string, Guid> TestUserIds = new()
    {
        { "test@example.com", new Guid("00000000-0000-0000-0000-000000000001") },
        { "admin@example.com", new Guid("00000000-0000-0000-0000-000000000002") },
        { "user@example.com", new Guid("00000000-0000-0000-0000-000000000003") }
    };

    private static readonly Dictionary<string, Guid> TestBuildIds = new()
    {
        { "pending-01", new Guid("10000000-0000-0000-0000-000000000001") },
        { "running-01", new Guid("10000000-0000-0000-0000-000000000002") },
        { "running-02", new Guid("10000000-0000-0000-0000-000000000003") },
        { "complete-01", new Guid("10000000-0000-0000-0000-000000000004") },
        { "failed-01", new Guid("10000000-0000-0000-0000-000000000005") },
        { "dataloader-test", new Guid("10000000-0000-0000-0000-000000000006") },
        { "pagination-test", new Guid("10000000-0000-0000-0000-000000000007") },
        { "transaction-test", new Guid("10000000-0000-0000-0000-000000000008") },
        { "edge-case-01", new Guid("10000000-0000-0000-0000-000000000009") },
        { "edge-case-02", new Guid("10000000-0000-0000-0000-000000000010") },
        { "decimal-precision-test", new Guid("10000000-0000-0000-0000-000000000011") }
    };

    /// <summary>
    /// Seed all test data: users, builds, parts, test runs.
    /// Idempotent - safe to call multiple times.
    /// </summary>
    public static async Task SeedAllAsync(FactoryDbContext dbContext)
    {
        // Generate bcrypt hash for test password: SecurePassword123!
        // Hash is regenerated each call (safe for idempotent seeding due to WHERE check in SeedTestUsersAsync)
        string hashedPassword = BCrypt.Net.BCrypt.HashPassword("SecurePassword123!");

        await SeedTestUsersAsync(dbContext, hashedPassword);
        await SeedTestBuildsAsync(dbContext);
        await SeedTestPartsAsync(dbContext);
        await SeedTestRunsAsync(dbContext);

        Console.WriteLine("✓ Test fixtures seeded successfully");
    }

    /// <summary>
    /// Seed test users for authentication testing.
    /// Creates 3 users: test, admin, user (all with same password for simplicity).
    /// </summary>
    public static async Task SeedTestUsersAsync(FactoryDbContext dbContext, string hashedPassword)
    {
        var users = new[]
        {
            new AuthUser
            {
                Id = TestUserIds["test@example.com"],
                Email = "test@example.com",
                PasswordHash = hashedPassword
            },
            new AuthUser
            {
                Id = TestUserIds["admin@example.com"],
                Email = "admin@example.com",
                PasswordHash = hashedPassword
            },
            new AuthUser
            {
                Id = TestUserIds["user@example.com"],
                Email = "user@example.com",
                PasswordHash = hashedPassword
            }
        };

        foreach (var user in users)
        {
            var existing = await dbContext.AuthUsers.FirstOrDefaultAsync(u => u.Email == user.Email);
            if (existing == null)
            {
                dbContext.AuthUsers.Add(user);
            }
            else
            {
                // Ensure password hash is current (idempotent)
                existing.PasswordHash = hashedPassword;
                dbContext.AuthUsers.Update(existing);
            }
        }

        await dbContext.SaveChangesAsync();
        Console.WriteLine("  • Test users: 3");
    }

    /// <summary>
    /// Seed 10 test builds covering all statuses and edge cases.
    /// Status distribution: PENDING (5), RUNNING (2), COMPLETE (1), FAILED (1), edge cases (1).
    /// </summary>
    public static async Task SeedTestBuildsAsync(FactoryDbContext dbContext)
    {
        var builds = new Build[]
        {
            // Happy path builds
            new()
            {
                Id = TestBuildIds["pending-01"],
                Name = "Q2 2026 Production Run",
                Description = "High-volume manufacturing build for Q2 2026",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = TestBuildIds["running-01"],
                Name = "Legacy System Migration",
                Description = "Update legacy system components",
                Status = BuildStatus.Running,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new()
            {
                Id = TestBuildIds["running-02"],
                Name = "Testing Phase Build",
                Description = "Comprehensive test coverage phase",
                Status = BuildStatus.Running,
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = TestBuildIds["complete-01"],
                Name = "Completed Build A",
                Description = "Successfully finished build",
                Status = BuildStatus.Complete,
                CreatedAt = DateTime.UtcNow.AddDays(-5),
                UpdatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new()
            {
                Id = TestBuildIds["failed-01"],
                Name = "Failed Build B",
                Description = "Build failed during testing phase",
                Status = BuildStatus.Failed,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            },

            // Specialized builds for specific tests
            new()
            {
                Id = TestBuildIds["dataloader-test"],
                Name = "DataLoader Test Build",
                Description = "Build with 10+ parts for N+1 query testing",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = TestBuildIds["pagination-test"],
                Name = "Pagination Test Build",
                Description = "Build for pagination boundary testing",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = TestBuildIds["transaction-test"],
                Name = "Transaction Test Build",
                Description = "Build for EF Core + Dapper transaction atomicity testing",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },

            // Edge case builds
            new()
            {
                Id = TestBuildIds["edge-case-01"],
                Name = "Edge Case Build 1",
                Description = new string('x', 1000), // Max length description
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = TestBuildIds["edge-case-02"],
                Name = "Edge Case Build 2",
                Description = string.Empty, // Empty description (optional field)
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new()
            {
                Id = TestBuildIds["decimal-precision-test"],
                Name = "Decimal Precision Test Build",
                Description = "Build with fractional quantity parts for precision testing (issue #132)",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        foreach (var build in builds)
        {
            if (!await dbContext.Builds.AnyAsync(b => b.Id == build.Id))
            {
                dbContext.Builds.Add(build);
            }
        }

        await dbContext.SaveChangesAsync();
        Console.WriteLine("  • Test builds: 11 (PENDING, RUNNING, COMPLETE, FAILED, edge cases, decimal precision)");
    }

    /// <summary>
    /// Seed test parts under the DataLoader test build and decimal precision test build.
    /// Creates 10 parts with integer quantities for DataLoader testing.
    /// Creates 3 parts with fractional quantities for decimal precision testing (issue #132).
    /// </summary>
    public static async Task SeedTestPartsAsync(FactoryDbContext dbContext)
    {
        // DataLoader test parts (integer quantities)
        var dataloaderBuildId = TestBuildIds["dataloader-test"];
        var dataloaderParts = new Part[]
        {
            new() { Id = Guid.NewGuid(), BuildId = dataloaderBuildId, Name = "Precision Bearing", SKU = "SKU-PB-001", Quantity = 5, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), BuildId = dataloaderBuildId, Name = "Control Module", SKU = "SKU-CM-042", Quantity = 2, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), BuildId = dataloaderBuildId, Name = "Power Supply Unit", SKU = "SKU-PSU-003", Quantity = 1, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), BuildId = dataloaderBuildId, Name = "Connector Assembly", SKU = "SKU-CA-015", Quantity = 8, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), BuildId = dataloaderBuildId, Name = "Sensor Module", SKU = "SKU-SM-007", Quantity = 3, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), BuildId = dataloaderBuildId, Name = "Communication Board", SKU = "SKU-CB-021", Quantity = 1, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), BuildId = dataloaderBuildId, Name = "Thermal Interface", SKU = "SKU-TI-009", Quantity = 4, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), BuildId = dataloaderBuildId, Name = "Mounting Hardware", SKU = "SKU-MH-012", Quantity = 50, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), BuildId = dataloaderBuildId, Name = "Cable Assembly A", SKU = "SKU-CAB-A-001", Quantity = 2, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), BuildId = dataloaderBuildId, Name = "Cable Assembly B", SKU = "SKU-CAB-B-002", Quantity = 3, CreatedAt = DateTime.UtcNow }
        };

        foreach (var part in dataloaderParts)
        {
            if (!await dbContext.Parts.AnyAsync(p => p.BuildId == dataloaderBuildId && p.SKU == part.SKU))
            {
                dbContext.Parts.Add(part);
            }
        }

        // Decimal precision test parts (fractional quantities for issue #132)
        var precisionBuildId = TestBuildIds["decimal-precision-test"];
        var precisionParts = new Part[]
        {
            new() { Id = Guid.NewGuid(), BuildId = precisionBuildId, Name = "Half Unit Component", SKU = "SKU-HALF-001", Quantity = 0.5m, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), BuildId = precisionBuildId, Name = "Single Point Five Units", SKU = "SKU-1.5-002", Quantity = 1.5m, CreatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), BuildId = precisionBuildId, Name = "Two Point Seventy Five Units", SKU = "SKU-2.75-003", Quantity = 2.75m, CreatedAt = DateTime.UtcNow }
        };

        foreach (var part in precisionParts)
        {
            if (!await dbContext.Parts.AnyAsync(p => p.BuildId == precisionBuildId && p.SKU == part.SKU))
            {
                dbContext.Parts.Add(part);
            }
        }

        await dbContext.SaveChangesAsync();
        Console.WriteLine("  • Test parts: 13 (10 integer + 3 decimal precision)");
    }

    /// <summary>
    /// Seed test runs for status and transaction testing.
    /// Creates test runs with PASSED, FAILED, and RUNNING statuses.
    /// </summary>
    public static async Task SeedTestRunsAsync(FactoryDbContext dbContext)
    {
        var completeBuildId = TestBuildIds["complete-01"];
        var failedBuildId = TestBuildIds["failed-01"];

        var testRuns = new TestRun[]
        {
            new()
            {
                Id = Guid.NewGuid(),
                BuildId = completeBuildId,
                Status = TestStatus.Passed,
                Result = "All assertions passed - 150/150 tests successful",
                FileUrl = "https://example.com/test-results/build-passed.json",
                CompletedAt = DateTime.UtcNow.AddDays(-3),
                CreatedAt = DateTime.UtcNow.AddDays(-3),
                UpdatedAt = DateTime.UtcNow.AddDays(-3)
            },
            new()
            {
                Id = Guid.NewGuid(),
                BuildId = completeBuildId,
                Status = TestStatus.Passed,
                Result = "Regression tests passed - no performance degradation",
                FileUrl = "https://example.com/test-results/perf-test.json",
                CompletedAt = DateTime.UtcNow.AddDays(-2),
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new()
            {
                Id = Guid.NewGuid(),
                BuildId = failedBuildId,
                Status = TestStatus.Failed,
                Result = "Assertion failed at line 42: expected voltage 12.0V ± 0.1V, got 11.8V",
                FileUrl = "https://example.com/test-logs/failure.log",
                CompletedAt = DateTime.UtcNow.AddDays(-1),
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new()
            {
                Id = Guid.NewGuid(),
                BuildId = failedBuildId,
                Status = TestStatus.Running,
                Result = null,
                FileUrl = null,
                CompletedAt = null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };

        foreach (var testRun in testRuns)
        {
            if (!await dbContext.TestRuns.AnyAsync(t => t.Id == testRun.Id))
            {
                dbContext.TestRuns.Add(testRun);
            }
        }

        await dbContext.SaveChangesAsync();
        Console.WriteLine("  • Test runs: 4 (PASSED, FAILED, RUNNING statuses)");
    }

    /// <summary>
    /// Clean up all test fixtures (for development reset).
    /// Removes all test data by ID range.
    /// </summary>
    public static async Task CleanupAllAsync(FactoryDbContext dbContext)
    {
        var testBuildIds = TestBuildIds.Values.ToList();
        var testUserEmails = TestUserIds.Keys.ToList();

        // Delete in order: TestRuns → Parts → Builds → AuthUsers
        await dbContext.TestRuns.Where(t => testBuildIds.Contains(t.BuildId)).ExecuteDeleteAsync();
        await dbContext.Parts.Where(p => testBuildIds.Contains(p.BuildId)).ExecuteDeleteAsync();
        await dbContext.Builds.Where(b => testBuildIds.Contains(b.Id)).ExecuteDeleteAsync();
        await dbContext.AuthUsers.Where(u => testUserEmails.Contains(u.Email)).ExecuteDeleteAsync();

        Console.WriteLine("✓ Test fixtures cleaned up");
    }
}
