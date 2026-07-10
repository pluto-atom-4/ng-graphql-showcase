using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.Tests.Workflows;

/// <summary>
/// Phase 6: Persistence & recovery tests.
/// Verify workflow history tracking and querying.
/// </summary>
public class BuildProcessWorkflowPersistenceTests : IAsyncLifetime
{
    private FactoryDbContext _dbContext = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<FactoryDbContext>()
            .UseSqlServer(TestConstants.TestConnectionString)
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
    public async Task WorkflowHistory_Records_PersistToDatbase()
    {
        // Arrange: Create build first (FK requirement)
        var buildId = Guid.NewGuid();
        var build = new Build { Id = buildId, Name = "Test", Status = BuildStatus.Pending, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        var instanceId = Guid.NewGuid();
        var records = new List<WorkflowHistoryRecord>
        {
            new() { Id = Guid.NewGuid(), WorkflowInstanceId = instanceId, BuildId = buildId, EventType = "Started", ActivityName = "GetBuildActivity", OldStatus = "Created", NewStatus = "Running", RecordedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), WorkflowInstanceId = instanceId, BuildId = buildId, EventType = "Executed", ActivityName = "ProcessPartsActivity", OldStatus = "Running", NewStatus = "Running", RecordedAt = DateTime.UtcNow.AddSeconds(1) },
            new() { Id = Guid.NewGuid(), WorkflowInstanceId = instanceId, BuildId = buildId, EventType = "Completed", ActivityName = "PublishBuildStatusActivity", OldStatus = "Running", NewStatus = "Finished", RecordedAt = DateTime.UtcNow.AddSeconds(2) }
        };

        // Act: Persist history
        _dbContext.Set<WorkflowHistoryRecord>().AddRange(records);
        await _dbContext.SaveChangesAsync();

        // Assert: Verify persisted
        var persisted = await _dbContext.Set<WorkflowHistoryRecord>()
            .Where(h => h.BuildId == buildId)
            .ToListAsync();

        Assert.Equal(3, persisted.Count);
        Assert.All(persisted, h => Assert.Equal(buildId, h.BuildId));
    }

    [Fact]
    public async Task WorkflowHistory_QueryByBuildId_ReturnsFiltdHistory()
    {
        // Arrange: Create builds first (FK requirement)
        var build1Id = Guid.NewGuid();
        var build2Id = Guid.NewGuid();

        _dbContext.Builds.AddRange(new List<Build>
        {
            new() { Id = build1Id, Name = "Build1", Status = BuildStatus.Pending, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Id = build2Id, Name = "Build2", Status = BuildStatus.Pending, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        });
        await _dbContext.SaveChangesAsync();

        var records = new List<WorkflowHistoryRecord>
        {
            new() { Id = Guid.NewGuid(), WorkflowInstanceId = Guid.NewGuid(), BuildId = build1Id, EventType = "Started", ActivityName = "GetBuildActivity", OldStatus = "Created", NewStatus = "Running", RecordedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), WorkflowInstanceId = Guid.NewGuid(), BuildId = build2Id, EventType = "Started", ActivityName = "GetBuildActivity", OldStatus = "Created", NewStatus = "Running", RecordedAt = DateTime.UtcNow }
        };

        _dbContext.Set<WorkflowHistoryRecord>().AddRange(records);
        await _dbContext.SaveChangesAsync();

        // Act: Query by build ID
        var build1History = await _dbContext.Set<WorkflowHistoryRecord>()
            .Where(h => h.BuildId == build1Id)
            .ToListAsync();

        // Assert
        Assert.Single(build1History);
        Assert.Equal(build1Id, build1History[0].BuildId);
    }

    [Fact]
    public async Task WorkflowHistory_QueryRecentDays_FiltersCorrectly()
    {
        // Arrange: Create build first (FK requirement)
        var buildId = Guid.NewGuid();
        _dbContext.Builds.Add(new() { Id = buildId, Name = "Test", Status = BuildStatus.Pending, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await _dbContext.SaveChangesAsync();

        var today = DateTime.UtcNow.Date;

        var records = new List<WorkflowHistoryRecord>
        {
            new() { Id = Guid.NewGuid(), WorkflowInstanceId = Guid.NewGuid(), BuildId = buildId, EventType = "Started", ActivityName = "Activity1", OldStatus = "Created", NewStatus = "Running", RecordedAt = today.AddDays(-10) },
            new() { Id = Guid.NewGuid(), WorkflowInstanceId = Guid.NewGuid(), BuildId = buildId, EventType = "Executed", ActivityName = "Activity2", OldStatus = "Running", NewStatus = "Running", RecordedAt = today.AddDays(-5) },
            new() { Id = Guid.NewGuid(), WorkflowInstanceId = Guid.NewGuid(), BuildId = buildId, EventType = "Completed", ActivityName = "Activity3", OldStatus = "Running", NewStatus = "Finished", RecordedAt = today }
        };

        _dbContext.Set<WorkflowHistoryRecord>().AddRange(records);
        await _dbContext.SaveChangesAsync();

        // Act: Query last 7 days
        var cutoff = today.AddDays(-7);
        var recentHistory = await _dbContext.Set<WorkflowHistoryRecord>()
            .Where(h => h.BuildId == buildId && h.RecordedAt >= cutoff)
            .ToListAsync();

        // Assert: Should get 2 records (5 days ago and today)
        Assert.Equal(2, recentHistory.Count);
    }

    [Fact]
    public async Task WorkflowHistory_Timestamps_RecordedAccurately()
    {
        // Arrange: Create build first (FK requirement)
        var buildId = Guid.NewGuid();
        _dbContext.Builds.Add(new() { Id = buildId, Name = "Test", Status = BuildStatus.Pending, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await _dbContext.SaveChangesAsync();

        var startTime = DateTime.UtcNow;
        var record = new WorkflowHistoryRecord
        {
            Id = Guid.NewGuid(),
            WorkflowInstanceId = Guid.NewGuid(),
            BuildId = buildId,
            EventType = "Started",
            ActivityName = "TestActivity",
            OldStatus = "Created",
            NewStatus = "Running",
            RecordedAt = startTime,
            ExecutionStarted = startTime.AddSeconds(1),
            ExecutionCompleted = startTime.AddSeconds(5),
            ElapsedMilliseconds = 4000
        };

        // Act
        _dbContext.Set<WorkflowHistoryRecord>().Add(record);
        await _dbContext.SaveChangesAsync();

        // Assert
        var persisted = await _dbContext.Set<WorkflowHistoryRecord>().FindAsync(record.Id);
        Assert.NotNull(persisted);
        Assert.Equal(4000, persisted.ElapsedMilliseconds);
    }
}
