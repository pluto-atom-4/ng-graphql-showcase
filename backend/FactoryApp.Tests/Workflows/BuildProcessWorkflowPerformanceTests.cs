using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using Xunit;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace FactoryApp.Tests.Workflows;

public class BuildProcessWorkflowPerformanceTests : IAsyncLifetime
{
    private FactoryDbContext _dbContext = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<FactoryDbContext>()
            .UseSqlServer(TestConstants.TestConnectionString)
            .Options;

        _dbContext = new FactoryDbContext(options);
        await _dbContext.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _dbContext.Database.EnsureDeletedAsync();
        _dbContext.Dispose();
    }

    [Fact]
    public async Task Workflow_100Concurrent_CompletesUnder30Seconds()
    {
        // Arrange: Create 100 builds
        var buildCount = 100;
        var builds = Enumerable.Range(0, buildCount)
            .Select(i => new Build
            {
                Id = Guid.NewGuid(),
                Name = $"Perf-Build-{i}",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Parts = new List<Part>
                {
                    new Part { Id = Guid.NewGuid(), BuildId = Guid.NewGuid(), Name = $"Part-{i}", SKU = $"SKU-{i}", Quantity = 1 }
                }
            })
            .ToList();

        // Update parts with correct BuildIds
        foreach (var build in builds)
        {
            foreach (var part in build.Parts)
            {
                part.BuildId = build.Id;
            }
        }

        _dbContext.Builds.AddRange(builds);
        await _dbContext.SaveChangesAsync();

        // Act: Process all builds concurrently
        var sw = Stopwatch.StartNew();

        var tasks = builds.Select(async b =>
        {
            // Simulate workflow activity
            var fetched = await _dbContext.Builds.FindAsync(b.Id);
            if (fetched != null)
            {
                fetched.Status = BuildStatus.Complete;
                _dbContext.Builds.Update(fetched);
            }
        }).ToList();

        await Task.WhenAll(tasks);
        await _dbContext.SaveChangesAsync();

        sw.Stop();

        // Assert: Completed within timeout
        Assert.True(sw.Elapsed < TimeSpan.FromSeconds(30),
            $"Performance: {sw.Elapsed.TotalSeconds}s (expected < 30s for {buildCount} builds)");

        // Verify all processed
        var released = await _dbContext.Builds
            .Where(b => b.Status == BuildStatus.Complete)
            .CountAsync();

        Assert.True(released >= buildCount * 0.9, // Allow 10% failure
            $"Expected >= {buildCount * 0.9} released, got {released}");
    }

    [Fact]
    public async Task Workflow_QueryPerformance_1000Builds_Under5Seconds()
    {
        // Arrange: Create 1000 builds
        var buildCount = 1000;
        var builds = Enumerable.Range(0, buildCount)
            .Select(i => new Build
            {
                Id = Guid.NewGuid(),
                Name = $"Query-Perf-{i}",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            })
            .ToList();

        _dbContext.Builds.AddRange(builds);
        await _dbContext.SaveChangesAsync();

        // Act: Query all builds
        var sw = Stopwatch.StartNew();

        var allBuilds = await _dbContext.Builds.ToListAsync();

        sw.Stop();

        // Assert: Query completed quickly
        Assert.True(sw.Elapsed < TimeSpan.FromSeconds(5),
            $"Query performance: {sw.Elapsed.TotalMilliseconds}ms (expected < 5000ms for {buildCount} builds)");

        Assert.Equal(buildCount, allBuilds.Count);
    }

    [Fact]
    public async Task Workflow_StatusFilterPerformance_Under1Second()
    {
        // Arrange: Create builds with different statuses
        var statuses = new[] { BuildStatus.Pending, BuildStatus.Running, BuildStatus.Complete };
        var builds = new List<Build>();

        foreach (var status in statuses)
        {
            for (var i = 0; i < 100; i++)
            {
                builds.Add(new Build
                {
                    Id = Guid.NewGuid(),
                    Name = $"Status-{status}-{i}",
                    Status = status,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        _dbContext.Builds.AddRange(builds);
        await _dbContext.SaveChangesAsync();

        // Act: Filter by status
        var sw = Stopwatch.StartNew();

        var pending = await _dbContext.Builds
            .Where(b => b.Status == BuildStatus.Pending)
            .ToListAsync();

        sw.Stop();

        // Assert: Filter completed quickly
        Assert.True(sw.Elapsed < TimeSpan.FromSeconds(1),
            $"Filter performance: {sw.Elapsed.TotalMilliseconds}ms (expected < 1000ms)");

        Assert.Equal(100, pending.Count);
    }

    [Fact]
    public async Task Workflow_BulkUpdate_100Builds_Under5Seconds()
    {
        // Arrange: Create 100 builds
        var builds = Enumerable.Range(0, 100)
            .Select(i => new Build
            {
                Id = Guid.NewGuid(),
                Name = $"Update-{i}",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            })
            .ToList();

        _dbContext.Builds.AddRange(builds);
        await _dbContext.SaveChangesAsync();

        // Act: Bulk update all statuses
        var sw = Stopwatch.StartNew();

        var allBuilds = await _dbContext.Builds.ToListAsync();
        foreach (var build in allBuilds)
        {
            build.Status = BuildStatus.Complete;
            build.UpdatedAt = DateTime.UtcNow;
        }
        _dbContext.Builds.UpdateRange(allBuilds);
        await _dbContext.SaveChangesAsync();

        sw.Stop();

        // Assert: Bulk update completed quickly
        Assert.True(sw.Elapsed < TimeSpan.FromSeconds(5),
            $"Bulk update: {sw.Elapsed.TotalMilliseconds}ms (expected < 5000ms for 100 builds)");
    }

    [Fact]
    public async Task Workflow_WithPartsInclude_PerformanceAcceptable()
    {
        // Arrange: Create 50 builds with 5 parts each
        var builds = Enumerable.Range(0, 50)
            .Select(i => new Build
            {
                Id = Guid.NewGuid(),
                Name = $"WithParts-{i}",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Parts = Enumerable.Range(0, 5)
                    .Select(p => new Part
                    {
                        Id = Guid.NewGuid(),
                        BuildId = Guid.NewGuid(), // Will fix below
                        Name = $"Part-{i}-{p}",
                        SKU = $"SKU-{i}-{p}",
                        Quantity = 10
                    })
                    .ToList()
            })
            .ToList();

        // Fix BuildIds
        foreach (var build in builds)
        {
            foreach (var part in build.Parts)
            {
                part.BuildId = build.Id;
            }
        }

        _dbContext.Builds.AddRange(builds);
        await _dbContext.SaveChangesAsync();

        // Act: Query with Include
        var sw = Stopwatch.StartNew();

        var withParts = await _dbContext.Builds
            .Include(b => b.Parts)
            .ToListAsync();

        sw.Stop();

        // Assert: Include query performance acceptable
        Assert.True(sw.Elapsed < TimeSpan.FromSeconds(2),
            $"Include query: {sw.Elapsed.TotalMilliseconds}ms (expected < 2000ms for 50 builds + 250 parts)");

        Assert.Equal(50, withParts.Count);
        Assert.All(withParts, b => Assert.Equal(5, b.Parts.Count));
    }

    [Fact]
    public async Task Workflow_SequentialProcessing_1000Builds_Under60Seconds()
    {
        // Arrange: Create 1000 builds
        var buildCount = 1000;
        var buildBatch = Enumerable.Range(0, buildCount)
            .Select(i => new Build
            {
                Id = Guid.NewGuid(),
                Name = $"Sequential-{i}",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Parts = new List<Part> { new Part { Id = Guid.NewGuid(), BuildId = Guid.NewGuid(), Name = $"Part-{i}", SKU = $"SKU-{i}", Quantity = 1 } }
            })
            .ToList();

        // Fix BuildIds
        foreach (var build in buildBatch)
        {
            foreach (var part in build.Parts)
            {
                part.BuildId = build.Id;
            }
        }

        _dbContext.Builds.AddRange(buildBatch);
        await _dbContext.SaveChangesAsync();

        // Act: Process sequentially (like workflow execution)
        var sw = Stopwatch.StartNew();

        var processed = 0;
        foreach (var build in buildBatch)
        {
            var fetched = await _dbContext.Builds
                .Include(b => b.Parts)
                .FirstOrDefaultAsync(b => b.Id == build.Id);

            if (fetched?.Parts?.Count > 0)
            {
                fetched.Status = BuildStatus.Complete;
                _dbContext.Builds.Update(fetched);
                processed++;

                // Batch saves every 100
                if (processed % 100 == 0)
                {
                    await _dbContext.SaveChangesAsync();
                }
            }
        }
        await _dbContext.SaveChangesAsync();

        sw.Stop();

        // Assert: Sequential processing completed within timeout
        Assert.True(sw.Elapsed < TimeSpan.FromSeconds(60),
            $"Sequential processing: {sw.Elapsed.TotalSeconds}s (expected < 60s for {buildCount} builds)");

        Assert.Equal(buildCount, processed);
    }

    [Fact]
    public async Task Workflow_Memory_StableOver100Iterations()
    {
        // Arrange: Track memory usage
        var initialMemory = GC.GetTotalMemory(true);

        // Act: Run same operation 100 times
        for (var iteration = 0; iteration < 100; iteration++)
        {
            var build = new Build
            {
                Id = Guid.NewGuid(),
                Name = $"Memory-Test-{iteration}",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.Builds.Add(build);

            if (iteration % 10 == 0)
            {
                await _dbContext.SaveChangesAsync();
                _dbContext.ChangeTracker.Clear();
            }
        }
        await _dbContext.SaveChangesAsync();

        var finalMemory = GC.GetTotalMemory(true);
        var memoryIncrease = finalMemory - initialMemory;

        // Assert: Memory increase reasonable (< 100MB for 100 iterations)
        Assert.True(memoryIncrease < 100 * 1024 * 1024,
            $"Memory increase: {memoryIncrease / 1024 / 1024}MB (expected < 100MB over 100 iterations)");
    }
}
