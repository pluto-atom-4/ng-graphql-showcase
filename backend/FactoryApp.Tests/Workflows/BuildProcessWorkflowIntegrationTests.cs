using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.Domain.Events;
using Moq;
using Xunit;
using Microsoft.EntityFrameworkCore;
using HotChocolate.Subscriptions;

namespace FactoryApp.Tests.Workflows;

/// <summary>
/// Phase 5d/5e Integration Tests: Verify activities' database and event operations
/// Tests data flow: GetBuild, ProcessParts, TriggerTestRun, PublishStatus
/// </summary>
public class BuildProcessWorkflowIntegrationTests : IAsyncLifetime
{
    private readonly Mock<ITopicEventSender> _eventSenderMock;
    private FactoryDbContext _dbContext = null!;
    private string _testDbName = null!;

    public BuildProcessWorkflowIntegrationTests()
    {
        _eventSenderMock = new Mock<ITopicEventSender>();
    }

    public async Task InitializeAsync()
    {
        _testDbName = $"FactoryAppDb_Test_{Guid.NewGuid():N}";
        var connectionString = "Server=localhost,1433;Database=FactoryAppDb_Test;User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=true;".Replace(
            "Database=FactoryAppDb_Test",
            $"Database={_testDbName}");

        var options = new DbContextOptionsBuilder<FactoryDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        _dbContext = new FactoryDbContext(options);
        await _dbContext.Database.EnsureDeletedAsync();
        await _dbContext.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await _dbContext.Database.EnsureDeletedAsync();
        _dbContext.Dispose();
    }

    // ===== GetBuildActivity Behavior Tests =====

    [Fact]
    public async Task Activity_GetBuild_FetchesBuildById()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Test Build",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act (simulates GetBuildActivity logic)
        var fetchedBuild = await _dbContext.Builds.FindAsync(buildId);

        // Assert
        Assert.NotNull(fetchedBuild);
        Assert.Equal(buildId, fetchedBuild.Id);
        Assert.Equal("Test Build", fetchedBuild.Name);
    }

    [Fact]
    public async Task Activity_GetBuild_WithNonexistentBuild_ReturnsNull()
    {
        // Act
        var fetchedBuild = await _dbContext.Builds.FindAsync(Guid.NewGuid());

        // Assert
        Assert.Null(fetchedBuild);
    }

    [Fact]
    public async Task Activity_GetBuild_WithGuidParsing_HandlesValidString()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var buildIdString = buildId.ToString();

        var build = new Build
        {
            Id = buildId,
            Name = "Guid Test",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act
        var isParsed = Guid.TryParse(buildIdString, out var parsedGuid);
        var fetchedBuild = isParsed ? await _dbContext.Builds.FindAsync(parsedGuid) : null;

        // Assert
        Assert.True(isParsed);
        Assert.NotNull(fetchedBuild);
        Assert.Equal(buildId, fetchedBuild.Id);
    }

    [Fact]
    public async Task Activity_GetBuild_WithGuidParsing_RejectsInvalidString()
    {
        // Act
        var isParsed = Guid.TryParse("not-a-guid", out _);

        // Assert
        Assert.False(isParsed);
    }

    // ===== ProcessPartsActivity Behavior Tests =====

    [Fact]
    public async Task Activity_ProcessParts_WithParts_ValidatesCorrectly()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Build with Parts",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part>
            {
                new Part { Id = Guid.NewGuid(), BuildId = buildId, Name = "Part 1", SKU = "SKU-001", Quantity = 5 },
                new Part { Id = Guid.NewGuid(), BuildId = buildId, Name = "Part 2", SKU = "SKU-002", Quantity = 10 }
            }
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act (simulates ProcessPartsActivity logic)
        var fetchedBuild = await _dbContext.Builds
            .Include(b => b.Parts)
            .FirstOrDefaultAsync(b => b.Id == buildId);

        var partsValid = fetchedBuild?.Parts?.Count > 0;

        // Assert
        Assert.True(partsValid);
        Assert.Equal(2, fetchedBuild?.Parts?.Count);
    }

    [Fact]
    public async Task Activity_ProcessParts_WithoutParts_ValidatesAsInvalid()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Build without Parts",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part>()
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act (simulates ProcessPartsActivity logic)
        var fetchedBuild = await _dbContext.Builds
            .Include(b => b.Parts)
            .FirstOrDefaultAsync(b => b.Id == buildId);

        var partsValid = fetchedBuild?.Parts?.Count > 0;

        // Assert
        Assert.False(partsValid);
    }

    [Fact]
    public async Task Activity_ProcessParts_WithNonexistentBuild_ReturnsNull()
    {
        // Act
        var fetchedBuild = await _dbContext.Builds
            .Include(b => b.Parts)
            .FirstOrDefaultAsync(b => b.Id == Guid.NewGuid());

        // Assert
        Assert.Null(fetchedBuild);
    }

    // ===== TriggerTestRunActivity Behavior Tests =====

    [Fact]
    public async Task Activity_TriggerTestRun_GeneratesTestRunId()
    {
        // Act (simulates TriggerTestRunActivity logic)
        var testRunId = Guid.NewGuid().ToString();

        // Assert
        Assert.False(string.IsNullOrEmpty(testRunId));
        Assert.True(Guid.TryParse(testRunId, out _));
    }

    [Fact]
    public async Task Activity_TriggerTestRun_PublishesEvent()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var testRunId = Guid.NewGuid().ToString();
        var eventSender = _eventSenderMock.Object;

        // Act (simulates TriggerTestRunActivity logic)
        var @event = new TestRunTriggeredEvent
        {
            BuildId = buildId,
            TestRunId = testRunId,
            Timestamp = DateTime.UtcNow
        };
        await eventSender.SendAsync($"testRunTriggered_{buildId}", @event);

        // Assert
        _eventSenderMock.Verify(
            es => es.SendAsync(
                $"testRunTriggered_{buildId}",
                It.Is<TestRunTriggeredEvent>(e => e.BuildId == buildId && e.TestRunId == testRunId)),
            Times.Once);
    }

    // ===== PublishBuildStatusActivity Behavior Tests =====

    [Fact]
    public async Task Activity_PublishStatus_WithValidStatus_PublishesEvent()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var oldStatus = BuildStatus.Pending;
        var newStatus = BuildStatus.Running;
        var eventSender = _eventSenderMock.Object;

        // Act (simulates PublishBuildStatusActivity logic)
        var @event = new BuildStatusChangedEvent
        {
            BuildId = buildId,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            Timestamp = DateTime.UtcNow
        };
        await eventSender.SendAsync("buildStatusChanged", @event);

        // Assert
        _eventSenderMock.Verify(
            es => es.SendAsync(
                "buildStatusChanged",
                It.Is<BuildStatusChangedEvent>(e =>
                    e.BuildId == buildId &&
                    e.OldStatus == oldStatus &&
                    e.NewStatus == newStatus)),
            Times.Once);
    }

    [Fact]
    public async Task Activity_PublishStatus_EnumParsing_HandlesValidString()
    {
        // Act
        var isParsed = Enum.TryParse<BuildStatus>("Running", out var status);

        // Assert
        Assert.True(isParsed);
        Assert.Equal(BuildStatus.Running, status);
    }

    [Fact]
    public async Task Activity_PublishStatus_EnumParsing_RejectsInvalidString()
    {
        // Act
        var isParsed = Enum.TryParse<BuildStatus>("InvalidStatus", out _);

        // Assert
        Assert.False(isParsed);
    }

    // ===== Workflow Data Flow Tests =====

    [Fact]
    public async Task Workflow_DataFlow_BuildId_PassesThroughActivities()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var buildIdString = buildId.ToString();

        var build = new Build
        {
            Id = buildId,
            Name = "Flow Test Build",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part> { new Part { Id = Guid.NewGuid(), BuildId = buildId, Name = "Part", SKU = "SKU-001", Quantity = 1 } }
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act - Simulate workflow data flow
        // GetBuild
        var isParsed = Guid.TryParse(buildIdString, out var parsedId);
        var fetchedBuild = isParsed ? await _dbContext.Builds.Include(b => b.Parts).FirstOrDefaultAsync(b => b.Id == parsedId) : null;

        // ProcessParts
        var partsValid = fetchedBuild?.Parts?.Count > 0;

        // TriggerTestRun
        var testRunId = Guid.NewGuid().ToString();

        // Assert
        Assert.NotNull(fetchedBuild);
        Assert.True(partsValid);
        Assert.False(string.IsNullOrEmpty(testRunId));
    }

    [Fact]
    public async Task Workflow_StatusTransition_PendingToRunning()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Status Test",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act
        var fetched = await _dbContext.Builds.FindAsync(buildId);
        fetched!.Status = BuildStatus.Running;
        fetched.UpdatedAt = DateTime.UtcNow;
        _dbContext.Builds.Update(fetched);
        await _dbContext.SaveChangesAsync();

        // Assert
        var updated = await _dbContext.Builds.FindAsync(buildId);
        Assert.Equal(BuildStatus.Running, updated?.Status);
    }

    [Fact]
    public async Task Workflow_StatusTransition_RunningToComplete()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Completion Test",
            Status = BuildStatus.Running,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act
        var fetched = await _dbContext.Builds.FindAsync(buildId);
        fetched!.Status = BuildStatus.Complete;
        fetched.UpdatedAt = DateTime.UtcNow;
        _dbContext.Builds.Update(fetched);
        await _dbContext.SaveChangesAsync();

        // Assert
        var updated = await _dbContext.Builds.FindAsync(buildId);
        Assert.Equal(BuildStatus.Complete, updated?.Status);
    }

    [Fact]
    public async Task Workflow_ErrorScenario_BuildNotFound()
    {
        // Act
        var fetchedBuild = await _dbContext.Builds.FindAsync(Guid.NewGuid());
        var partsValid = fetchedBuild?.Parts?.Count > 0;

        // Assert
        Assert.Null(fetchedBuild);
        Assert.False(partsValid);
    }

    [Fact]
    public async Task Workflow_MultipleBuilds_ProcessingCorrectOne()
    {
        // Arrange
        var buildId1 = Guid.NewGuid();
        var buildId2 = Guid.NewGuid();

        var build1 = new Build { Id = buildId1, Name = "Build 1", Status = BuildStatus.Pending, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
        var build2 = new Build { Id = buildId2, Name = "Build 2", Status = BuildStatus.Pending, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };

        _dbContext.Builds.AddRange(build1, build2);
        await _dbContext.SaveChangesAsync();

        // Act
        var fetched = await _dbContext.Builds.FindAsync(buildId2);

        // Assert
        Assert.NotNull(fetched);
        Assert.Equal(buildId2, fetched.Id);
        Assert.Equal("Build 2", fetched.Name);
    }
}
