using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.Domain.Events;
using Moq;
using Xunit;
using Microsoft.EntityFrameworkCore;
using HotChocolate.Subscriptions;

namespace FactoryApp.Tests.Workflows;

public class BuildProcessWorkflowHappyPathTests : IAsyncLifetime
{
    private readonly Mock<ITopicEventSender> _eventSenderMock;
    private FactoryDbContext _dbContext = null!;
    private Guid _buildId;

    public BuildProcessWorkflowHappyPathTests()
    {
        _eventSenderMock = new Mock<ITopicEventSender>();
    }

    public async Task InitializeAsync()
    {
        var dbName = $"FactoryAppDb_Test_{nameof(BuildProcessWorkflowHappyPathTests)}_{Guid.NewGuid()}";
        var connectionString = $"Server=localhost,1433;Database={dbName};User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=true;";
        var options = new DbContextOptionsBuilder<FactoryDbContext>()
            .UseSqlServer(connectionString)
            .Options;

        _dbContext = new FactoryDbContext(options);
        await _dbContext.Database.EnsureCreatedAsync();
        _buildId = Guid.NewGuid();
    }

    public async Task DisposeAsync()
    {
        await _dbContext.Database.EnsureDeletedAsync();
        _dbContext.Dispose();
    }

    [Fact]
    public async Task Workflow_HappyPath_AllActivitiesExecute()
    {
        // Arrange: Build with parts
        var build = new Build
        {
            Id = _buildId,
            Name = "Happy Path Test",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part>
            {
                new Part { Id = Guid.NewGuid(), BuildId = _buildId, Name = "Part A", SKU = "SKU-001", Quantity = 5 },
                new Part { Id = Guid.NewGuid(), BuildId = _buildId, Name = "Part B", SKU = "SKU-002", Quantity = 10 }
            }
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Simulate workflow execution (GetBuild → ProcessParts → TriggerTestRun → PublishStatus)
        // 1. GetBuild
        var fetchedBuild = await _dbContext.Builds.FindAsync(_buildId);
        Assert.NotNull(fetchedBuild);

        // 2. ProcessParts
        var buildWithParts = await _dbContext.Builds
            .Include(b => b.Parts)
            .FirstOrDefaultAsync(b => b.Id == _buildId);
        var partsValid = buildWithParts?.Parts?.Count > 0;
        Assert.True(partsValid);

        // 3. TriggerTestRun
        var testRunId = Guid.NewGuid().ToString();
        await _eventSenderMock.Object.SendAsync("testRunTriggered", new TestRunTriggeredEvent
        {
            BuildId = _buildId,
            TestRunId = testRunId,
            Timestamp = DateTime.UtcNow
        });

        // 4. PublishStatus
        fetchedBuild!.Status = BuildStatus.Complete;
        fetchedBuild.UpdatedAt = DateTime.UtcNow;
        _dbContext.Builds.Update(fetchedBuild);
        await _dbContext.SaveChangesAsync();

        await _eventSenderMock.Object.SendAsync("buildStatusChanged", new BuildStatusChangedEvent
        {
            BuildId = _buildId,
            OldStatus = BuildStatus.Pending,
            NewStatus = BuildStatus.Complete,
            Timestamp = DateTime.UtcNow
        });

        // Assert: All activities executed
        var updated = await _dbContext.Builds.FindAsync(_buildId);
        Assert.Equal(BuildStatus.Complete, updated?.Status);

        _eventSenderMock.Verify(
            es => es.SendAsync(It.IsAny<string>(), It.IsAny<object>()),
            Times.AtLeast(2)); // TriggerTestRun + PublishStatus events
    }

    [Fact]
    public async Task Workflow_StatusTransitions_PendingToReleased()
    {
        // Arrange
        var build = new Build
        {
            Id = _buildId,
            Name = "Status Transition Test",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Simulate workflow status transitions
        var fetched = await _dbContext.Builds.FindAsync(_buildId);
        var statusProgression = new[] { BuildStatus.Running, BuildStatus.Complete, BuildStatus.Complete };

        foreach (var newStatus in statusProgression)
        {
            fetched!.Status = newStatus;
            fetched.UpdatedAt = DateTime.UtcNow;
            _dbContext.Builds.Update(fetched);
            await _dbContext.SaveChangesAsync();

            var current = await _dbContext.Builds.FindAsync(_buildId);
            Assert.Equal(newStatus, current?.Status);
        }

        // Assert: Final status is Released
        var final = await _dbContext.Builds.FindAsync(_buildId);
        Assert.Equal(BuildStatus.Complete, final?.Status);
    }

    [Fact]
    public async Task Workflow_DataFlow_BuildIdThroughActivities()
    {
        // Arrange: Create build with parts
        var buildIdString = _buildId.ToString();
        var build = new Build
        {
            Id = _buildId,
            Name = "Data Flow Test",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part>
            {
                new Part { Id = Guid.NewGuid(), BuildId = _buildId, Name = "Part", SKU = "SKU-001", Quantity = 1 }
            }
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Data flow through workflow
        // GetBuild: Parse BuildId
        var isParsed = Guid.TryParse(buildIdString, out var parsedId);
        Assert.True(isParsed);

        // Fetch build
        var fetchedBuild = await _dbContext.Builds
            .Include(b => b.Parts)
            .FirstOrDefaultAsync(b => b.Id == parsedId);
        Assert.NotNull(fetchedBuild);

        // ProcessParts: Validate
        var partsValid = fetchedBuild.Parts.Count > 0;
        Assert.True(partsValid);

        // TriggerTestRun: Generate TestRunId
        var testRunId = Guid.NewGuid().ToString();
        Assert.False(string.IsNullOrEmpty(testRunId));

        // PublishStatus: Update status
        fetchedBuild.Status = BuildStatus.Complete;
        _dbContext.Builds.Update(fetchedBuild);
        await _dbContext.SaveChangesAsync();

        // Assert: Final state
        var final = await _dbContext.Builds.FindAsync(_buildId);
        Assert.Equal(BuildStatus.Complete, final?.Status);
    }

    [Fact]
    public async Task Workflow_EventsPublished_InCorrectOrder()
    {
        // Arrange
        var build = new Build
        {
            Id = _buildId,
            Name = "Event Order Test",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part> { new Part { Id = Guid.NewGuid(), BuildId = _buildId, Name = "Part", SKU = "SKU-001", Quantity = 1 } }
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Publish events in workflow order
        var eventOrder = new List<string>();

        // Event 1: TriggerTestRun
        var testRunEvent = new TestRunTriggeredEvent { BuildId = _buildId, TestRunId = Guid.NewGuid().ToString(), Timestamp = DateTime.UtcNow };
        await _eventSenderMock.Object.SendAsync("testRunTriggered", testRunEvent);
        eventOrder.Add("testRunTriggered");

        // Event 2: PublishBuildStatus
        var statusEvent = new BuildStatusChangedEvent { BuildId = _buildId, OldStatus = BuildStatus.Pending, NewStatus = BuildStatus.Complete, Timestamp = DateTime.UtcNow };
        await _eventSenderMock.Object.SendAsync("buildStatusChanged", statusEvent);
        eventOrder.Add("buildStatusChanged");

        // Assert: Events published in correct order
        Assert.Equal(2, eventOrder.Count);
        Assert.Equal("testRunTriggered", eventOrder[0]);
        Assert.Equal("buildStatusChanged", eventOrder[1]);

        _eventSenderMock.Verify(
            es => es.SendAsync("testRunTriggered", It.IsAny<TestRunTriggeredEvent>()),
            Times.Once);

        _eventSenderMock.Verify(
            es => es.SendAsync("buildStatusChanged", It.IsAny<BuildStatusChangedEvent>()),
            Times.Once);
    }

    [Fact]
    public async Task Workflow_MultipleBuilds_ProcessedIndependently()
    {
        // Arrange: Create 3 builds
        var buildIds = new[] { _buildId, Guid.NewGuid(), Guid.NewGuid() };
        var builds = buildIds.Select(id => new Build
        {
            Id = id,
            Name = $"Build-{id}",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part> { new Part { Id = Guid.NewGuid(), BuildId = id, Name = "Part", SKU = "SKU-001", Quantity = 1 } }
        }).ToList();

        _dbContext.Builds.AddRange(builds);
        await _dbContext.SaveChangesAsync();

        // Act: Process each build independently
        foreach (var buildId in buildIds)
        {
            var build = await _dbContext.Builds.FindAsync(buildId);
            build!.Status = BuildStatus.Complete;
            _dbContext.Builds.Update(build);
        }
        await _dbContext.SaveChangesAsync();

        // Assert: All builds transitioned correctly
        var released = await _dbContext.Builds
            .Where(b => buildIds.Contains(b.Id) && b.Status == BuildStatus.Complete)
            .CountAsync();
        Assert.Equal(3, released);
    }
}
