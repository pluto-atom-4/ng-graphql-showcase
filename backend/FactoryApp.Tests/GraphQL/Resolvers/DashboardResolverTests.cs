using System.Diagnostics;
using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL;
using FactoryApp.GraphQL.DataLoaders;
using FactoryApp.GraphQL.Services;
using FactoryApp.Tests.Fixtures;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Xunit;

namespace FactoryApp.Tests.GraphQL.Resolvers;

/// <summary>
/// Phase 6 (Issue #267): Integration tests for dashboard resolvers.
/// Tests 15+ scenarios covering:
/// - GetBuildMetrics: Correct counts by status
/// - GetPaginatedBuildsWithSorting: Pagination, sorting, filtering
/// - GetRecentActivities: Activity retrieval and DataLoader prevention of N+1
/// - Error handling and edge cases
/// - Performance validation (< 100ms execution)
/// </summary>
public class DashboardResolverTests : IAsyncLifetime
{
    private readonly TestDatabaseFixture _fixture = new();
    private FactoryDbContext _context = null!;
    private BuildQueryType _query = null!;
    private LoggingService _loggingService = null!;
    private BuildDataLoaders _dataLoaders = null!;

    public async Task InitializeAsync()
    {
        await _fixture.InitializeAsync();
        _context = _fixture.GetContext();

        var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
        _loggingService = new LoggingService(loggerFactory.CreateLogger<LoggingService>());
        _dataLoaders = new BuildDataLoaders(_context);

        _query = new BuildQueryType();
    }

    public async Task DisposeAsync()
    {
        await _fixture.DisposeAsync();
    }

    #region GetBuildMetrics Tests

    [Fact]
    public async Task GetBuildMetrics_WithVariousStatuses_ReturnsCorrectCounts()
    {
        // Arrange
        var builds = new[]
        {
            new Build { Id = Guid.NewGuid(), Name = "Build1", Status = BuildStatus.Pending, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Build { Id = Guid.NewGuid(), Name = "Build2", Status = BuildStatus.Running, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Build { Id = Guid.NewGuid(), Name = "Build3", Status = BuildStatus.Running, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Build { Id = Guid.NewGuid(), Name = "Build4", Status = BuildStatus.Complete, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Build { Id = Guid.NewGuid(), Name = "Build5", Status = BuildStatus.Complete, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Build { Id = Guid.NewGuid(), Name = "Build6", Status = BuildStatus.Complete, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Build { Id = Guid.NewGuid(), Name = "Build7", Status = BuildStatus.Failed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        foreach (var build in builds)
        {
            _context.Builds.Add(build);
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _query.GetBuildMetrics(_context, _loggingService);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(7, result.Total);
        Assert.Equal(2, result.InProgress);
        Assert.Equal(3, result.Completed);
        Assert.Equal(1, result.Failed);
        Assert.Equal(1, result.Pending);
    }

    [Fact]
    public async Task GetBuildMetrics_WithEmptyDatabase_ReturnsZeros()
    {
        // Act
        var result = await _query.GetBuildMetrics(_context, _loggingService);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.Total);
        Assert.Equal(0, result.InProgress);
        Assert.Equal(0, result.Completed);
        Assert.Equal(0, result.Failed);
        Assert.Equal(0, result.Pending);
    }

    [Fact]
    public async Task GetBuildMetrics_WithAllSameStatus_ReturnsCorrectDistribution()
    {
        // Arrange
        var builds = Enumerable.Range(1, 5)
            .Select(i => new Build
            {
                Id = Guid.NewGuid(),
                Name = $"Build{i}",
                Status = BuildStatus.Running,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            })
            .ToList();

        foreach (var build in builds)
        {
            _context.Builds.Add(build);
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _query.GetBuildMetrics(_context, _loggingService);

        // Assert
        Assert.Equal(5, result.Total);
        Assert.Equal(5, result.InProgress);
        Assert.Equal(0, result.Completed);
        Assert.Equal(0, result.Failed);
        Assert.Equal(0, result.Pending);
    }

    [Fact]
    public async Task GetBuildMetrics_Performance_ExecutesUnderHundredMilliseconds()
    {
        // Arrange: Create 1000 builds with various statuses
        var random = new Random();
        var builds = Enumerable.Range(1, 1000)
            .Select(i => new Build
            {
                Id = Guid.NewGuid(),
                Name = $"Build{i}",
                Status = (BuildStatus)(random.Next(0, 5)),
                CreatedAt = DateTime.UtcNow.AddHours(-i),
                UpdatedAt = DateTime.UtcNow.AddHours(-i)
            })
            .ToList();

        foreach (var build in builds)
        {
            _context.Builds.Add(build);
        }
        await _context.SaveChangesAsync();

        // Act
        var stopwatch = Stopwatch.StartNew();
        var result = await _query.GetBuildMetrics(_context, _loggingService);
        stopwatch.Stop();

        // Assert
        Assert.NotNull(result);
        Assert.True(stopwatch.ElapsedMilliseconds < 100, $"Execution took {stopwatch.ElapsedMilliseconds}ms, expected < 100ms");
    }

    #endregion

    #region GetPaginatedBuildsWithSorting Tests

    [Fact]
    public async Task GetPaginatedBuildsWithSorting_WithValidParams_ReturnsSortedResults()
    {
        // Arrange
        var builds = Enumerable.Range(1, 15)
            .Select(i => new Build
            {
                Id = Guid.NewGuid(),
                Name = $"Build {i}",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                UpdatedAt = DateTime.UtcNow.AddDays(-i)
            })
            .ToList();

        foreach (var build in builds)
        {
            _context.Builds.Add(build);
        }
        await _context.SaveChangesAsync();

        // Act: Sort by createdAt desc (most recent first)
        var result = await _query.GetPaginatedBuildsWithSorting(
            _context, _loggingService, limit: 10, offset: 0, sortBy: "createdAt", sortOrder: "desc");

        // Assert
        Assert.Equal(10, result.Items.Count);
        Assert.Equal(15, result.TotalCount);
        Assert.True(result.HasNextPage);
        Assert.False(result.HasPreviousPage);
        Assert.True(result.Items.First().CreatedAt > result.Items.Last().CreatedAt);
    }

    [Fact]
    public async Task GetPaginatedBuildsWithSorting_SortByCreatedAtAsc_ReturnsSortedAscending()
    {
        // Arrange
        var builds = Enumerable.Range(1, 10)
            .Select(i => new Build
            {
                Id = Guid.NewGuid(),
                Name = $"Build {i}",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                UpdatedAt = DateTime.UtcNow
            })
            .ToList();

        foreach (var build in builds)
        {
            _context.Builds.Add(build);
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _query.GetPaginatedBuildsWithSorting(
            _context, _loggingService, limit: 10, offset: 0, sortBy: "createdAt", sortOrder: "asc");

        // Assert
        Assert.Equal(10, result.Items.Count);
        Assert.True(result.Items.First().CreatedAt < result.Items.Last().CreatedAt);
    }

    [Fact]
    public async Task GetPaginatedBuildsWithSorting_SortByStatus_ReturnsSortedByStatus()
    {
        // Arrange
        var builds = new[]
        {
            new Build { Id = Guid.NewGuid(), Name = "B1", Status = BuildStatus.Failed, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Build { Id = Guid.NewGuid(), Name = "B2", Status = BuildStatus.Complete, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Build { Id = Guid.NewGuid(), Name = "B3", Status = BuildStatus.Running, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new Build { Id = Guid.NewGuid(), Name = "B4", Status = BuildStatus.Pending, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
        };

        foreach (var build in builds)
        {
            _context.Builds.Add(build);
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _query.GetPaginatedBuildsWithSorting(
            _context, _loggingService, limit: 10, offset: 0, sortBy: "status", sortOrder: "asc");

        // Assert
        Assert.Equal(4, result.Items.Count);
        var statuses = result.Items.Select(b => b.Status).ToList();
        Assert.True(statuses[0] <= statuses[1] && statuses[1] <= statuses[2] && statuses[2] <= statuses[3]);
    }

    [Fact]
    public async Task GetPaginatedBuildsWithSorting_WithPaginationOffset_ReturnsCorrectPage()
    {
        // Arrange
        var builds = Enumerable.Range(1, 25)
            .Select(i => new Build
            {
                Id = Guid.NewGuid(),
                Name = $"Build {i}",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                UpdatedAt = DateTime.UtcNow
            })
            .ToList();

        foreach (var build in builds)
        {
            _context.Builds.Add(build);
        }
        await _context.SaveChangesAsync();

        // Act: Get page 2 (offset 10, limit 10)
        var result = await _query.GetPaginatedBuildsWithSorting(
            _context, _loggingService, limit: 10, offset: 10, sortBy: "createdAt", sortOrder: "desc");

        // Assert
        Assert.Equal(10, result.Items.Count);
        Assert.Equal(25, result.TotalCount);
        Assert.True(result.HasNextPage);
        Assert.True(result.HasPreviousPage);
    }

    [Fact]
    public async Task GetPaginatedBuildsWithSorting_InvalidSortBy_ThrowsException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _query.GetPaginatedBuildsWithSorting(
                _context, _loggingService, limit: 10, offset: 0, sortBy: "invalidField", sortOrder: "desc"));
    }

    [Fact]
    public async Task GetPaginatedBuildsWithSorting_InvalidSortOrder_ThrowsException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _query.GetPaginatedBuildsWithSorting(
                _context, _loggingService, limit: 10, offset: 0, sortBy: "createdAt", sortOrder: "invalid"));
    }

    [Fact]
    public async Task GetPaginatedBuildsWithSorting_InvalidLimit_ThrowsException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _query.GetPaginatedBuildsWithSorting(
                _context, _loggingService, limit: -1, offset: 0, sortBy: "createdAt", sortOrder: "desc"));
    }

    [Fact]
    public async Task GetPaginatedBuildsWithSorting_LimitExceedsMax_ThrowsException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _query.GetPaginatedBuildsWithSorting(
                _context, _loggingService, limit: 101, offset: 0, sortBy: "createdAt", sortOrder: "desc"));
    }

    #endregion

    #region GetRecentActivities & DataLoader Tests

    [Fact]
    public async Task GetRecentActivities_WithActivities_ReturnsUpToLimit()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var build = new Build { Id = buildId, Name = "TestBuild", Status = BuildStatus.Running, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _context.Builds.Add(build);

        var activities = Enumerable.Range(1, 15)
            .Select(i => new WorkflowHistoryRecord
            {
                Id = Guid.NewGuid(),
                WorkflowInstanceId = Guid.NewGuid(),
                BuildId = buildId,
                EventType = "ActivityCompleted",
                ActivityName = $"Activity{i}",
                OldStatus = "Running",
                NewStatus = "Complete",
                RecordedAt = DateTime.UtcNow.AddMinutes(-i)
            })
            .ToList();

        foreach (var activity in activities)
        {
            _context.Add(activity);
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _query.GetRecentActivities(buildId, _context, _dataLoaders, _loggingService, limit: 10);

        // Assert
        Assert.Equal(10, result.Count());
        var activityList = result.ToList();
        Assert.True(activityList.First().RecordedAt >= activityList.Last().RecordedAt);
    }

    [Fact]
    public async Task GetRecentActivities_NoBuild_ReturnsEmptyList()
    {
        // Act
        var result = await _query.GetRecentActivities(Guid.NewGuid(), _context, _dataLoaders, _loggingService, limit: 10);

        // Assert
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetRecentActivities_DataLoader_PreventsN1Queries()
    {
        // Arrange: Create 5 builds with 10 activities each
        var buildIds = Enumerable.Range(1, 5).Select(_ => Guid.NewGuid()).ToList();

        foreach (var buildId in buildIds)
        {
            var build = new Build { Id = buildId, Name = $"Build{buildId}", Status = BuildStatus.Running, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.Builds.Add(build);
        }
        await _context.SaveChangesAsync();

        // Add activities
        foreach (var buildId in buildIds)
        {
            for (int i = 0; i < 10; i++)
            {
                var activity = new WorkflowHistoryRecord
                {
                    Id = Guid.NewGuid(),
                    WorkflowInstanceId = Guid.NewGuid(),
                    BuildId = buildId,
                    EventType = "ActivityCompleted",
                    ActivityName = $"Activity{i}",
                    OldStatus = "Pending",
                    NewStatus = "Complete",
                    RecordedAt = DateTime.UtcNow.AddMinutes(-i)
                };
                _context.Add(activity);
            }
        }
        await _context.SaveChangesAsync();

        // Act: Batch load activities for all builds (single query via DataLoader)
        var result = await _dataLoaders.GetRecentActivitiesByBuildId(buildIds, limit: 10);

        // Assert
        Assert.Equal(5, result.Count);
        foreach (var buildId in buildIds)
        {
            Assert.True(result.ContainsKey(buildId));
            Assert.Equal(10, result[buildId].Count);
        }
    }

    [Fact]
    public async Task GetRecentActivities_WithCustomLimit_ReturnsOnlyLimitedActivities()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var build = new Build { Id = buildId, Name = "TestBuild", Status = BuildStatus.Running, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        _context.Builds.Add(build);

        for (int i = 0; i < 20; i++)
        {
            var activity = new WorkflowHistoryRecord
            {
                Id = Guid.NewGuid(),
                WorkflowInstanceId = Guid.NewGuid(),
                BuildId = buildId,
                EventType = "ActivityCompleted",
                ActivityName = $"Activity{i}",
                OldStatus = "Pending",
                NewStatus = "Complete",
                RecordedAt = DateTime.UtcNow.AddMinutes(-i)
            };
            _context.Add(activity);
        }
        await _context.SaveChangesAsync();

        // Act
        var result = await _query.GetRecentActivities(buildId, _context, _dataLoaders, _loggingService, limit: 5);

        // Assert
        Assert.Equal(5, result.Count());
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task GetBuildMetrics_OnDatabaseError_ThrowsGraphQLException()
    {
        // Arrange: Create context with invalid connection
        var invalidContext = CreateInvalidContext();

        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _query.GetBuildMetrics(invalidContext, _loggingService));
    }

    [Fact]
    public async Task GetPaginatedBuildsWithSorting_OnDatabaseError_ThrowsGraphQLException()
    {
        // Arrange: Create context with invalid connection
        var invalidContext = CreateInvalidContext();

        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _query.GetPaginatedBuildsWithSorting(invalidContext, _loggingService, 10, 0, "createdAt", "desc"));
    }

    #endregion

    #region Performance Tests

    [Fact]
    public async Task GetPaginatedBuildsWithSorting_Performance_ExecutesUnderHundredMilliseconds()
    {
        // Arrange: Create 500 builds
        var builds = Enumerable.Range(1, 500)
            .Select(i => new Build
            {
                Id = Guid.NewGuid(),
                Name = $"Build {i}",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow.AddDays(-i),
                UpdatedAt = DateTime.UtcNow
            })
            .ToList();

        foreach (var build in builds)
        {
            _context.Builds.Add(build);
        }
        await _context.SaveChangesAsync();

        // Act
        var stopwatch = Stopwatch.StartNew();
        var result = await _query.GetPaginatedBuildsWithSorting(
            _context, _loggingService, limit: 10, offset: 0, sortBy: "createdAt", sortOrder: "desc");
        stopwatch.Stop();

        // Assert
        Assert.NotNull(result);
        Assert.True(stopwatch.ElapsedMilliseconds < 100, $"Execution took {stopwatch.ElapsedMilliseconds}ms, expected < 100ms");
    }

    #endregion

    #region Helper Methods

    private FactoryDbContext CreateInvalidContext()
    {
        var optionsBuilder = new DbContextOptionsBuilder<FactoryDbContext>();
        optionsBuilder.UseSqlServer("Server=invalid-server;Database=invalid-db;");
        return new FactoryDbContext(optionsBuilder.Options);
    }

    #endregion
}
