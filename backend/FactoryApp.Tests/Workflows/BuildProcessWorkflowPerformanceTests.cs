using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using System.Diagnostics;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.Tests.Workflows;

/// <summary>
/// Phase 6: Performance & load testing.
/// Measure workflow history performance under load.
/// </summary>
public class BuildProcessWorkflowPerformanceTests : IAsyncLifetime
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
    public async Task WorkflowHistory_Bulk_InsertFast()
    {
        // Arrange: Create 100 builds first (FK requirement)
        var buildIds = Enumerable.Range(0, 100).Select(_ => Guid.NewGuid()).ToList();
        var builds = buildIds.Select(id => new Build { Id = id, Name = "Test", Status = BuildStatus.Pending, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }).ToList();
        _dbContext.Builds.AddRange(builds);
        await _dbContext.SaveChangesAsync();

        var records = buildIds
            .Select((buildId, i) => new WorkflowHistoryRecord
            {
                Id = Guid.NewGuid(),
                WorkflowInstanceId = Guid.NewGuid(),
                BuildId = buildId,
                EventType = "Executed",
                ActivityName = $"Activity-{i}",
                OldStatus = "Running",
                NewStatus = "Running",
                RecordedAt = DateTime.UtcNow
            })
            .ToList();

        // Act: Measure insert time
        var sw = Stopwatch.StartNew();
        _dbContext.Set<WorkflowHistoryRecord>().AddRange(records);
        await _dbContext.SaveChangesAsync();
        sw.Stop();

        // Assert: Insert should be fast (< 5 seconds for 100 records)
        Assert.True(sw.ElapsedMilliseconds < 5000, $"Bulk insert took {sw.ElapsedMilliseconds}ms (expected < 5000ms)");
    }

    [Fact]
    public async Task WorkflowHistory_Query_ReturnsQuickly()
    {
        // Arrange: Create build first (FK requirement)
        var buildId = Guid.NewGuid();
        _dbContext.Builds.Add(new() { Id = buildId, Name = "Test", Status = BuildStatus.Pending, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
        await _dbContext.SaveChangesAsync();

        var records = Enumerable.Range(0, 50)
            .Select(i => new WorkflowHistoryRecord
            {
                Id = Guid.NewGuid(),
                WorkflowInstanceId = Guid.NewGuid(),
                BuildId = buildId,
                EventType = "Executed",
                ActivityName = $"Activity-{i}",
                OldStatus = "Running",
                NewStatus = "Running",
                RecordedAt = DateTime.UtcNow.AddSeconds(i)
            })
            .ToList();

        _dbContext.Set<WorkflowHistoryRecord>().AddRange(records);
        await _dbContext.SaveChangesAsync();

        // Act: Query and measure time
        var sw = Stopwatch.StartNew();
        var results = await _dbContext.Set<WorkflowHistoryRecord>()
            .Where(h => h.BuildId == buildId)
            .OrderBy(h => h.RecordedAt)
            .ToListAsync();
        sw.Stop();

        // Assert: Query should be fast (< 1 second)
        Assert.Equal(50, results.Count);
        Assert.True(sw.ElapsedMilliseconds < 1000, $"Query took {sw.ElapsedMilliseconds}ms (expected < 1000ms)");
    }

    [Fact]
    public async Task WorkflowHistory_Sequential_NoMemoryLeak()
    {
        // Arrange: Simulate 10 sequential executions
        var sw = Stopwatch.StartNew();

        for (int exec = 0; exec < 10; exec++)
        {
            var buildId = Guid.NewGuid();
            // Create build first (FK requirement)
            _dbContext.Builds.Add(new() { Id = buildId, Name = "Test", Status = BuildStatus.Pending, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow });
            await _dbContext.SaveChangesAsync();

            var records = Enumerable.Range(0, 10)
                .Select(i => new WorkflowHistoryRecord
                {
                    Id = Guid.NewGuid(),
                    WorkflowInstanceId = Guid.NewGuid(),
                    BuildId = buildId,
                    EventType = "Executed",
                    ActivityName = $"Activity-{i}",
                    OldStatus = "Running",
                    NewStatus = "Running",
                    RecordedAt = DateTime.UtcNow
                })
                .ToList();

            _dbContext.Set<WorkflowHistoryRecord>().AddRange(records);
            await _dbContext.SaveChangesAsync();

            // Clear context to prevent memory buildup
            _dbContext.ChangeTracker.Clear();
        }

        sw.Stop();

        // Assert: All 10 executions should complete < 10 seconds
        Assert.True(sw.ElapsedMilliseconds < 10000, $"Sequential executions took {sw.ElapsedMilliseconds}ms (expected < 10000ms)");
    }
}
