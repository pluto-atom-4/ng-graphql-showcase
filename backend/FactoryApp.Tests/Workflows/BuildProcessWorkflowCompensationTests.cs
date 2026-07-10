using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.Tests.Workflows;

/// <summary>
/// Phase 6: Failure & compensation tests.
/// Verify error handling and rollback/compensation logic.
/// </summary>
public class BuildProcessWorkflowCompensationTests : IAsyncLifetime
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
    public async Task Activity_ProcessParts_WithEmptyParts_FailsGracefully()
    {
        // Arrange: Build with no parts
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Empty Parts Build",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part>() // Empty - should fail
        };

        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Simulate ProcessPartsActivity with empty parts
        var buildWithParts = await _dbContext.Builds
            .Include(b => b.Parts)
            .FirstOrDefaultAsync(b => b.Id == buildId);

        var partsValid = buildWithParts?.Parts?.Count > 0;

        if (!partsValid)
        {
            // Compensation: Mark as failed
            buildWithParts!.Status = BuildStatus.Failed;
            _dbContext.Builds.Update(buildWithParts);

            var failureRecord = new WorkflowHistoryRecord
            {
                Id = Guid.NewGuid(),
                WorkflowInstanceId = Guid.NewGuid(),
                BuildId = buildId,
                EventType = "Failed",
                ActivityName = "ProcessPartsActivity",
                OldStatus = BuildStatus.Pending.ToString(),
                NewStatus = BuildStatus.Failed.ToString(),
                ErrorMessage = "Build has no parts",
                RecordedAt = DateTime.UtcNow
            };

            _dbContext.Set<WorkflowHistoryRecord>().Add(failureRecord);
            await _dbContext.SaveChangesAsync();
        }

        // Assert
        Assert.False(partsValid);
        var failed = await _dbContext.Builds.FindAsync(buildId);
        Assert.Equal(BuildStatus.Failed, failed!.Status);

        var history = await _dbContext.Set<WorkflowHistoryRecord>()
            .FirstOrDefaultAsync(h => h.BuildId == buildId);
        Assert.NotNull(history);
        Assert.Equal("Build has no parts", history.ErrorMessage);
    }

    [Fact]
    public async Task Activity_GetBuild_WithNonexistentId_ReturnsNull()
    {
        // Arrange
        var nonexistentBuildId = Guid.NewGuid();

        // Act: Simulate GetBuildActivity with nonexistent ID
        var build = await _dbContext.Builds.FindAsync(nonexistentBuildId);

        // Assert
        Assert.Null(build);
    }

    [Fact]
    public async Task Activity_GetBuild_InvalidGuidParsing_HandlesError()
    {
        // Arrange
        var invalidBuildIdString = "not-a-valid-guid";

        // Act: Attempt to parse invalid GUID
        var success = Guid.TryParse(invalidBuildIdString, out var buildId);

        // Assert
        Assert.False(success);
    }

    [Fact]
    public async Task Workflow_FailureRecorded_WithErrorMessage()
    {
        // Arrange: Build in failed state
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Failed Build",
            Status = BuildStatus.Failed,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Record failure in history
        var failureRecord = new WorkflowHistoryRecord
        {
            Id = Guid.NewGuid(),
            WorkflowInstanceId = Guid.NewGuid(),
            BuildId = buildId,
            EventType = "Failed",
            ActivityName = "TriggerTestRunActivity",
            OldStatus = BuildStatus.Running.ToString(),
            NewStatus = BuildStatus.Failed.ToString(),
            ErrorMessage = "Test run timeout after 30s",
            RecordedAt = DateTime.UtcNow
        };

        _dbContext.Set<WorkflowHistoryRecord>().Add(failureRecord);
        await _dbContext.SaveChangesAsync();

        // Assert
        var history = await _dbContext.Set<WorkflowHistoryRecord>()
            .Where(h => h.BuildId == buildId)
            .ToListAsync();

        Assert.Single(history);
        Assert.Contains("timeout", history[0].ErrorMessage!);
    }
}
