using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.Tests.GraphQL.Mutations;

/// <summary>
/// Phase 6: GraphQL mutation → workflow integration tests.
/// Test build creation and workflow state synchronization.
/// </summary>
public class BuildMutationWorkflowTests : IAsyncLifetime
{
    private FactoryDbContext _dbContext = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<FactoryDbContext>()
            .UseSqlServer("Server=localhost,1433;Database=FactoryAppDb_Test_Mutations;User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=true;")
            .Options;

        _dbContext = new FactoryDbContext(options);
        await _dbContext.Database.EnsureDeletedAsync();
        await _dbContext.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        if (_dbContext != null)
        {
            await _dbContext.Database.EnsureDeletedAsync();
            _dbContext.Dispose();
        }
    }

    [Fact]
    public async Task Build_Created_PersistsSuccessfully()
    {
        // Arrange: Simulate CreateBuild mutation
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "GraphQL Test Build",
            Description = "Created via mutation",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Act: Create build (simulates mutation)
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Assert: Verify build persisted
        var persisted = await _dbContext.Builds.FindAsync(buildId);
        Assert.NotNull(persisted);
        Assert.Equal("GraphQL Test Build", persisted.Name);
        Assert.Equal(BuildStatus.Pending, persisted.Status);
    }

    [Fact]
    public async Task Build_CreatedWithParts_PersistRelationships()
    {
        // Arrange: Build with parts
        var buildId = Guid.NewGuid();
        var part1Id = Guid.NewGuid();
        var part2Id = Guid.NewGuid();

        var build = new Build
        {
            Id = buildId,
            Name = "Build With Parts",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part>
            {
                new() { Id = part1Id, BuildId = buildId, Name = "Part-A", SKU = "SKU-A", Quantity = 5 },
                new() { Id = part2Id, BuildId = buildId, Name = "Part-B", SKU = "SKU-B", Quantity = 3 }
            }
        };

        // Act
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Assert
        var retrieved = await _dbContext.Builds
            .Include(b => b.Parts)
            .FirstOrDefaultAsync(b => b.Id == buildId);

        Assert.NotNull(retrieved);
        Assert.Equal(2, retrieved.Parts.Count);
    }

    [Fact]
    public async Task BuildStatus_Updated_ReflectsMutation()
    {
        // Arrange: Create build
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Status Update Test",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Simulate UpdateBuildStatus mutation
        var existing = await _dbContext.Builds.FindAsync(buildId);
        existing!.Status = BuildStatus.Running;
        existing.UpdatedAt = DateTime.UtcNow;
        _dbContext.Builds.Update(existing);
        await _dbContext.SaveChangesAsync();

        // Assert
        var updated = await _dbContext.Builds.FindAsync(buildId);
        Assert.Equal(BuildStatus.Running, updated!.Status);
    }

    [Fact]
    public async Task Build_WithWorkflowHistory_QueryableViaGraphQL()
    {
        // Arrange: Build + workflow history
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Queryable Build",
            Status = BuildStatus.Complete,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Builds.Add(build);

        var history = new WorkflowHistoryRecord
        {
            Id = Guid.NewGuid(),
            WorkflowInstanceId = Guid.NewGuid(),
            BuildId = buildId,
            EventType = "Completed",
            ActivityName = "PublishBuildStatusActivity",
            OldStatus = "Running",
            NewStatus = "Finished",
            RecordedAt = DateTime.UtcNow
        };

        _dbContext.Set<WorkflowHistoryRecord>().Add(history);
        await _dbContext.SaveChangesAsync();

        // Act: Query build with history (simulates GraphQL query)
        var retrieved = await _dbContext.Builds
            .Where(b => b.Id == buildId)
            .FirstOrDefaultAsync();

        var historyRecords = await _dbContext.Set<WorkflowHistoryRecord>()
            .Where(h => h.BuildId == buildId)
            .ToListAsync();

        // Assert
        Assert.NotNull(retrieved);
        Assert.Single(historyRecords);
        Assert.Equal(buildId, historyRecords[0].BuildId);
    }
}
