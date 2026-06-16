using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL;
using FactoryApp.GraphQL.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Xunit;

namespace FactoryApp.Tests;

public class BuildQueryTests : IAsyncLifetime
{
    private FactoryDbContext _context = null!;
    private BuildQueryType _query = null!;
    private LoggingService _loggingService = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<FactoryDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new FactoryDbContext(options);
        await _context.Database.EnsureCreatedAsync();

        var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
        _loggingService = new LoggingService(loggerFactory.CreateLogger<LoggingService>());

        _query = new BuildQueryType();
    }

    public async Task DisposeAsync()
    {
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task GetBuild_WithValidId_ReturnsBuild()
    {
        // Arrange
        var build = new Build
        {
            Id = Guid.NewGuid(),
            Name = "Test Build",
            Description = "Test Description",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Builds.Add(build);
        await _context.SaveChangesAsync();

        // Act
        var result = await _query.GetBuild(build.Id, _context, _loggingService);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(build.Id, result.Id);
        Assert.Equal("Test Build", result.Name);
    }

    [Fact]
    public async Task GetBuild_WithInvalidId_ReturnsNull()
    {
        // Arrange
        var invalidId = Guid.NewGuid();

        // Act
        var result = await _query.GetBuild(invalidId, _context, _loggingService);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void GetBuilds_ReturnsQueryable()
    {
        // Arrange
        var builds = new[]
        {
            new Build
            {
                Id = Guid.NewGuid(),
                Name = "Build 1",
                Status = BuildStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            },
            new Build
            {
                Id = Guid.NewGuid(),
                Name = "Build 2",
                Status = BuildStatus.Running,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }
        };
        foreach (var build in builds)
        {
            _context.Builds.Add(build);
        }
        _context.SaveChanges();

        // Act
        var result = _query.GetBuilds(_context);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetBuildsPaginated_WithValidParams_ReturnsPaginatedResult()
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

        // Act
        var result = await _query.GetBuildsPaginated(10, 0, _context, _loggingService);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.Items.Count);
        Assert.Equal(15, result.TotalCount);
        Assert.True(result.HasNextPage);
        Assert.False(result.HasPreviousPage);
    }

    [Fact]
    public async Task GetBuildsPaginated_WithSecondPage_ReturnsSecondPageData()
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

        // Act
        var result = await _query.GetBuildsPaginated(10, 10, _context, _loggingService);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Items.Count);
        Assert.Equal(15, result.TotalCount);
        Assert.False(result.HasNextPage);
        Assert.True(result.HasPreviousPage);
    }

    [Fact]
    public async Task GetBuildsPaginated_WithInvalidLimit_ThrowsException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _query.GetBuildsPaginated(-1, 0, _context, _loggingService));
    }

    [Fact]
    public async Task GetBuildsPaginated_WithInvalidOffset_ThrowsException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _query.GetBuildsPaginated(10, -1, _context, _loggingService));
    }
}
