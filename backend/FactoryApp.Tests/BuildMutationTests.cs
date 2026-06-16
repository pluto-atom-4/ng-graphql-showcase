using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL;
using FactoryApp.GraphQL.Services;
using HotChocolate;
using HotChocolate.Subscriptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Xunit;

namespace FactoryApp.Tests;

public class BuildMutationTests : IAsyncLifetime
{
    private FactoryDbContext _context = null!;
    private BuildMutationType _mutation = null!;
    private AuthService _authService = null!;
    private LoggingService _loggingService = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<FactoryDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _context = new FactoryDbContext(options);
        await _context.Database.EnsureCreatedAsync();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Jwt:Secret", "super-secret-key-for-testing-purposes-only!" },
                { "Jwt:Issuer", "test-issuer" },
                { "Jwt:Audience", "test-audience" },
                { "Jwt:ExpirationHours", "1" }
            })
            .Build();

        _authService = new AuthService(config);

        var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
        _loggingService = new LoggingService(loggerFactory.CreateLogger<LoggingService>());

        _mutation = new BuildMutationType();
    }

    public async Task DisposeAsync()
    {
        await _context.DisposeAsync();
    }

    [Fact]
    public async Task CreateBuild_WithValidInput_ReturnsBuildPayload()
    {
        // Act
        var result = await _mutation.CreateBuild("Test Build", "Description", _context, _loggingService);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test Build", result.Name);
        Assert.Equal("Description", result.Description);
        Assert.Equal("Pending", result.Status);
    }

    [Fact]
    public async Task CreateBuild_WithEmptyName_ThrowsException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _mutation.CreateBuild("", null, _context, _loggingService));
    }

    [Fact]
    public async Task CreateBuild_WithNameTooLong_ThrowsException()
    {
        // Arrange
        var longName = new string('a', 257);

        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _mutation.CreateBuild(longName, null, _context, _loggingService));
    }

    [Fact]
    public async Task CreateBuild_WithDescriptionTooLong_ThrowsException()
    {
        // Arrange
        var longDescription = new string('a', 1001);

        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _mutation.CreateBuild("Valid Name", longDescription, _context, _loggingService));
    }

    [Fact]
    public async Task UpdateBuildStatus_WithValidBuildId_UpdatesStatus()
    {
        // Arrange
        var build = new Build
        {
            Id = Guid.NewGuid(),
            Name = "Test Build",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Builds.Add(build);
        await _context.SaveChangesAsync();

        var topicEventSender = new MockTopicEventSender();

        // Act
        var result = await _mutation.UpdateBuildStatus(
            build.Id, BuildStatus.Running, _context, topicEventSender, _loggingService);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Running", result.Status);
        Assert.Equal(build.Id, result.Id);
    }

    [Fact]
    public async Task UpdateBuildStatus_WithInvalidBuildId_ThrowsException()
    {
        // Arrange
        var invalidId = Guid.NewGuid();
        var topicEventSender = new MockTopicEventSender();

        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _mutation.UpdateBuildStatus(invalidId, BuildStatus.Running, _context, topicEventSender, _loggingService));
    }

    [Fact]
    public async Task AddPart_WithValidInput_ReturnsPartPayload()
    {
        // Arrange
        var build = new Build
        {
            Id = Guid.NewGuid(),
            Name = "Test Build",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Builds.Add(build);
        await _context.SaveChangesAsync();

        // Act
        var result = await _mutation.AddPart(build.Id, "Part Name", "SKU123", 10, _context, _loggingService);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Part Name", result.Name);
        Assert.Equal("SKU123", result.SKU);
        Assert.Equal(10, result.Quantity);
        Assert.Equal(build.Id, result.BuildId);
    }

    [Fact]
    public async Task AddPart_WithZeroQuantity_ThrowsException()
    {
        // Arrange
        var buildId = Guid.NewGuid();

        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _mutation.AddPart(buildId, "Part", "SKU", 0, _context, _loggingService));
    }

    [Fact]
    public async Task AddPart_WithInvalidBuildId_ThrowsException()
    {
        // Arrange
        var invalidBuildId = Guid.NewGuid();

        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _mutation.AddPart(invalidBuildId, "Part", "SKU", 10, _context, _loggingService));
    }

    [Fact]
    public async Task SubmitTestRun_WithValidInput_ReturnsTestRunPayload()
    {
        // Arrange
        var build = new Build
        {
            Id = Guid.NewGuid(),
            Name = "Test Build",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Builds.Add(build);
        await _context.SaveChangesAsync();

        var topicEventSender = new MockTopicEventSender();

        // Act
        var result = await _mutation.SubmitTestRun(
            build.Id, TestStatus.Passed, "Test passed", "https://example.com/test", _context, topicEventSender, _loggingService);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Passed", result.Status);
        Assert.Equal("Test passed", result.Result);
        Assert.Equal(build.Id, result.BuildId);
    }

    [Fact]
    public async Task SubmitTestRun_FailedWithoutResult_ThrowsException()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var topicEventSender = new MockTopicEventSender();

        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => _mutation.SubmitTestRun(buildId, TestStatus.Failed, null, null, _context, topicEventSender, _loggingService));
    }
}

public class MockTopicEventSender : ITopicEventSender
{
    public ValueTask SendAsync<TMessage>(string topicName, TMessage message, CancellationToken cancellationToken = default)
    {
        return ValueTask.CompletedTask;
    }

    public ValueTask CompleteAsync(string topicName)
    {
        return ValueTask.CompletedTask;
    }
}
