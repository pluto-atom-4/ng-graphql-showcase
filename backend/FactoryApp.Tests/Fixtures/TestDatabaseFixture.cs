using FactoryApp.Domain;
using FactoryApp.Domain.TestFixtures;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace FactoryApp.Tests.Fixtures;

/// <summary>
/// Manages test database lifecycle: creation, migration, seeding, cleanup.
/// Creates unique test database per test run; automatically cleaned up via DROP DATABASE.
/// </summary>
public class TestDatabaseFixture : IAsyncLifetime
{
    private readonly string _testDbName;
    protected bool SeedData { get; init; } = true;
    private FactoryDbContext _context = null!;

    public TestDatabaseFixture() : this(seedData: true)
    {
    }

    protected TestDatabaseFixture(bool seedData)
    {
        _testDbName = $"FactoryAppDb_Test_{Guid.NewGuid():N}";
        SeedData = seedData;
    }

    public async Task InitializeAsync()
    {
        var connectionString = BuildConnectionString(_testDbName);
        var options = new DbContextOptionsBuilder<FactoryDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        _context = new FactoryDbContext(options);

        // Create schema via EF Core migrations
        await _context.Database.MigrateAsync();

        // Seed test fixtures only if requested
        if (SeedData)
        {
            await FixtureSeeder.SeedAllAsync(_context);
        }
    }

    public async Task DisposeAsync()
    {
        // Drop test database
        var masterConnection = BuildConnectionString("master");
        using (var connection = new SqlConnection(masterConnection))
        {
            await connection.OpenAsync();
            using (var cmd = connection.CreateCommand())
            {
                cmd.CommandText = $"ALTER DATABASE [{_testDbName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{_testDbName}]";
                await cmd.ExecuteNonQueryAsync();
            }
        }

        _context.Dispose();
    }

    public FactoryDbContext GetContext() => _context;

    private static string BuildConnectionString(string database)
    {
        // Load configuration from appsettings (matches main app pattern)
        var config = new ConfigurationBuilder()
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        // Extract password from appsettings connection string
        var defaultConn = config.GetConnectionString("DefaultConnection");
        string saPassword;

        if (!string.IsNullOrEmpty(defaultConn))
        {
            // Extract password from "Password=xxx;" pattern
            var match = System.Text.RegularExpressions.Regex.Match(defaultConn, @"Password=([^;]+)");
            saPassword = match.Success ? match.Groups[1].Value : "P@ssw0rd1234!";
        }
        else
        {
            // Fallback to environment variable (for CI/CD)
            saPassword = Environment.GetEnvironmentVariable("MSSQL_SA_PASSWORD") ?? "P@ssw0rd1234!";
        }

        return $"Server=localhost,1433;Database={database};User Id=sa;Password={saPassword};TrustServerCertificate=true;";
    }
}
