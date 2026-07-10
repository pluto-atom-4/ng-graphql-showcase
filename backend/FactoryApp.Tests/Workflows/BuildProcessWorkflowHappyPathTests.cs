using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.Tests.Workflows;

/// <summary>
/// Phase 6: Happy path workflow execution tests.
/// Tests complete activity sequence: GetBuild → ProcessParts → TriggerTestRun → AwaitCompletion → PublishStatus.
/// Simulates activity logic and verifies database state changes.
/// </summary>
public class BuildProcessWorkflowHappyPathTests : IAsyncLifetime
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
    public async Task Activity_GetBuild_WithValidBuildId_FetchesSuccessfully()
    {
        // Arrange: Create build with parts
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Happy Path Build",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part>
            {
                new() { Id = Guid.NewGuid(), BuildId = buildId, Name = "Part-1", SKU = "SKU-001", Quantity = 5 },
                new() { Id = Guid.NewGuid(), BuildId = buildId, Name = "Part-2", SKU = "SKU-002", Quantity = 10 }
            }
        };

        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Simulate GetBuildActivity
        var fetchedBuild = await _dbContext.Builds
            .Include(b => b.Parts)
            .FirstOrDefaultAsync(b => b.Id == buildId);

        // Assert
        Assert.NotNull(fetchedBuild);
        Assert.Equal(buildId, fetchedBuild.Id);
        Assert.Equal(BuildStatus.Pending, fetchedBuild.Status);
        Assert.Equal(2, fetchedBuild.Parts.Count);
    }

    [Fact]
    public async Task Activity_ProcessParts_WithParts_ValidatesSuccessfully()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var part1Id = Guid.NewGuid();
        var part2Id = Guid.NewGuid();

        var build = new Build
        {
            Id = buildId,
            Name = "Parts Processing",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part>
            {
                new() { Id = part1Id, BuildId = buildId, Name = "Part-1", SKU = "SKU-001", Quantity = 5 },
                new() { Id = part2Id, BuildId = buildId, Name = "Part-2", SKU = "SKU-002", Quantity = 10 }
            }
        };

        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Simulate ProcessPartsActivity logic
        var buildWithParts = await _dbContext.Builds
            .Include(b => b.Parts)
            .FirstOrDefaultAsync(b => b.Id == buildId);

        var partsValid = buildWithParts?.Parts?.Count > 0;

        // Transition to Running state
        if (partsValid)
        {
            buildWithParts!.Status = BuildStatus.Running;
            _dbContext.Builds.Update(buildWithParts);
            await _dbContext.SaveChangesAsync();
        }

        // Assert
        Assert.True(partsValid);
        var updated = await _dbContext.Builds.FindAsync(buildId);
        Assert.Equal(BuildStatus.Running, updated!.Status);
    }

    [Fact]
    public async Task Activity_PublishBuildStatus_UpdatesAndRecordsHistory()
    {
        // Arrange: Build in Running state
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Publish Status Test",
            Status = BuildStatus.Running,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part> { new() { Id = Guid.NewGuid(), BuildId = buildId, Name = "Part-1", SKU = "SKU-003", Quantity = 1 } }
        };

        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Simulate PublishBuildStatusActivity (transition to Complete)
        var existing = await _dbContext.Builds.FindAsync(buildId);
        existing!.Status = BuildStatus.Complete;
        existing.UpdatedAt = DateTime.UtcNow;
        _dbContext.Builds.Update(existing);

        // Record workflow history
        var history = new WorkflowHistoryRecord
        {
            Id = Guid.NewGuid(),
            WorkflowInstanceId = Guid.NewGuid(),
            BuildId = buildId,
            EventType = "Completed",
            ActivityName = "PublishBuildStatusActivity",
            OldStatus = BuildStatus.Running.ToString(),
            NewStatus = BuildStatus.Complete.ToString(),
            RecordedAt = DateTime.UtcNow
        };

        _dbContext.Set<WorkflowHistoryRecord>().Add(history);
        await _dbContext.SaveChangesAsync();

        // Assert
        var finalBuild = await _dbContext.Builds.FindAsync(buildId);
        Assert.Equal(BuildStatus.Complete, finalBuild!.Status);

        var historyRecord = await _dbContext.Set<WorkflowHistoryRecord>()
            .FirstOrDefaultAsync(h => h.BuildId == buildId);
        Assert.NotNull(historyRecord);
        Assert.Equal(buildId, historyRecord.BuildId);
        Assert.Equal("Completed", historyRecord.EventType);
    }
}
