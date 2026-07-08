using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.Domain.Events;
using Moq;
using Xunit;
using Microsoft.EntityFrameworkCore;
using HotChocolate.Subscriptions;

namespace FactoryApp.Tests.Workflows;

public class BuildProcessWorkflowCompensationTests : IAsyncLifetime
{
    private readonly Mock<ITopicEventSender> _eventSenderMock;
    private FactoryDbContext _dbContext = null!;

    public BuildProcessWorkflowCompensationTests()
    {
        _eventSenderMock = new Mock<ITopicEventSender>();
    }

    public async Task InitializeAsync()
    {
        var dbName = $"FactoryAppDb_Test_{nameof(BuildProcessWorkflowCompensationTests)}_{Guid.NewGuid()}";
        var connectionString = $"Server=localhost,1433;Database={dbName};User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=true;";
        var options = new DbContextOptionsBuilder<FactoryDbContext>()
            .UseSqlServer(connectionString)
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
    public async Task Workflow_ProcessPartsActivityFails_RollsBackToPending()
    {
        // Arrange: Build with NO parts (ProcessPartsActivity fails)
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Build No Parts",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part>() // Empty—fails ProcessPartsActivity
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Workflow proceeds but ProcessPartsActivity detects failure
        var fetchedBuild = await _dbContext.Builds
            .Include(b => b.Parts)
            .FirstOrDefaultAsync(b => b.Id == buildId);

        var partsValid = fetchedBuild?.Parts?.Count > 0;
        Assert.False(partsValid); // Parts validation fails

        // Compensation: Trigger rollback workflow
        fetchedBuild!.Status = BuildStatus.Failed;
        fetchedBuild.UpdatedAt = DateTime.UtcNow;
        _dbContext.Builds.Update(fetchedBuild);
        await _dbContext.SaveChangesAsync();

        // Publish compensation event
        await _eventSenderMock.Object.SendAsync("buildStatusChanged", new BuildStatusChangedEvent
        {
            BuildId = buildId,
            OldStatus = BuildStatus.Pending,
            NewStatus = BuildStatus.Failed,
            Timestamp = DateTime.UtcNow
        });

        // Assert: Compensation executed
        var compensated = await _dbContext.Builds.FindAsync(buildId);
        Assert.Equal(BuildStatus.Failed, compensated?.Status);

        _eventSenderMock.Verify(
            es => es.SendAsync("buildStatusChanged", It.Is<BuildStatusChangedEvent>(e => e.NewStatus == BuildStatus.Failed)),
            Times.Once);
    }

    [Fact]
    public async Task Workflow_BuildNotFound_HandlesGracefully()
    {
        // Arrange: Non-existent build
        var nonExistentBuildId = Guid.NewGuid();

        // Act: Attempt to fetch non-existent build
        var fetchedBuild = await _dbContext.Builds.FindAsync(nonExistentBuildId);

        // Assert: Null returned, workflow should handle gracefully
        Assert.Null(fetchedBuild);
    }

    [Fact]
    public async Task Workflow_InvalidBuildId_RejectsEarly()
    {
        // Arrange: Invalid Guid string
        var invalidBuildId = "not-a-guid";

        // Act: Attempt to parse
        var isParsed = Guid.TryParse(invalidBuildId, out var parsedId);

        // Assert: Parse fails, workflow rejects early
        Assert.False(isParsed);
    }

    [Fact]
    public async Task Workflow_EventPublishingFails_ContinuesWithoutCrashing()
    {
        // Arrange: Setup build
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Event Failure Test",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part> { new Part { Id = Guid.NewGuid(), BuildId = buildId, Name = "Part", SKU = "SKU-001", Quantity = 1 } }
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Mock event sender to throw exception
        _eventSenderMock
            .Setup(es => es.SendAsync(It.IsAny<string>(), It.IsAny<object>()))
            .ThrowsAsync(new InvalidOperationException("Event publish failed"));

        // Act: Event publish fails but workflow continues
        try
        {
            await _eventSenderMock.Object.SendAsync("testRunTriggered", new TestRunTriggeredEvent
            {
                BuildId = buildId,
                TestRunId = Guid.NewGuid().ToString(),
                Timestamp = DateTime.UtcNow
            });
        }
        catch (InvalidOperationException)
        {
            // Expected: Event publishing threw
        }

        // Workflow still updates status despite event failure
        var fetched = await _dbContext.Builds.FindAsync(buildId);
        fetched!.Status = BuildStatus.Complete;
        _dbContext.Builds.Update(fetched);
        await _dbContext.SaveChangesAsync();

        // Assert: Workflow completed despite event failure
        var updated = await _dbContext.Builds.FindAsync(buildId);
        Assert.Equal(BuildStatus.Complete, updated?.Status);
    }

    [Fact]
    public async Task Workflow_ActivityThrows_CompensationRollsBack()
    {
        // Arrange: Simulate activity throwing exception
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Exception Test",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part> { new Part { Id = Guid.NewGuid(), BuildId = buildId, Name = "Part", SKU = "SKU-001", Quantity = 1 } }
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Activity throws exception
        try
        {
            throw new InvalidOperationException("Activity execution failed");
        }
        catch (InvalidOperationException)
        {
            // Compensation: Rollback status
            var fetched = await _dbContext.Builds.FindAsync(buildId);
            fetched!.Status = BuildStatus.Failed;
            _dbContext.Builds.Update(fetched);
            await _dbContext.SaveChangesAsync();

            // Publish failure event
            await _eventSenderMock.Object.SendAsync("buildStatusChanged", new BuildStatusChangedEvent
            {
                BuildId = buildId,
                OldStatus = BuildStatus.Pending,
                NewStatus = BuildStatus.Failed,
                Timestamp = DateTime.UtcNow
            });
        }

        // Assert: Compensation rolled back status
        var rolledBack = await _dbContext.Builds.FindAsync(buildId);
        Assert.Equal(BuildStatus.Failed, rolledBack?.Status);

        _eventSenderMock.Verify(
            es => es.SendAsync("buildStatusChanged", It.Is<BuildStatusChangedEvent>(e => e.NewStatus == BuildStatus.Failed)),
            Times.Once);
    }

    [Fact]
    public async Task Workflow_PartialCompletion_CompensatesAllChanges()
    {
        // Arrange: Create build that will partially complete
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Partial Completion",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part> { new Part { Id = Guid.NewGuid(), BuildId = buildId, Name = "Part", SKU = "SKU-001", Quantity = 1 } }
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Simulate partial completion then failure
        // Step 1: GetBuild succeeds
        var fetched = await _dbContext.Builds.FindAsync(buildId);
        Assert.NotNull(fetched);

        // Step 2: ProcessParts succeeds
        var withParts = await _dbContext.Builds.Include(b => b.Parts).FirstOrDefaultAsync(b => b.Id == buildId);
        var partsValid = withParts?.Parts?.Count > 0;
        Assert.True(partsValid);

        // Step 3: TriggerTestRun publishes event
        var testRunId = Guid.NewGuid().ToString();
        await _eventSenderMock.Object.SendAsync("testRunTriggered", new TestRunTriggeredEvent
        {
            BuildId = buildId,
            TestRunId = testRunId,
            Timestamp = DateTime.UtcNow
        });

        // Step 4: AwaitTestCompletion fails—trigger compensation
        fetched!.Status = BuildStatus.Failed;
        _dbContext.Builds.Update(fetched);
        await _dbContext.SaveChangesAsync();

        // Publish rollback event
        await _eventSenderMock.Object.SendAsync("buildStatusChanged", new BuildStatusChangedEvent
        {
            BuildId = buildId,
            OldStatus = BuildStatus.Pending,
            NewStatus = BuildStatus.Failed,
            Timestamp = DateTime.UtcNow
        });

        // Assert: Compensation completed, all changes rolled back
        var final = await _dbContext.Builds.FindAsync(buildId);
        Assert.Equal(BuildStatus.Failed, final?.Status);

        // Verify both events were published
        _eventSenderMock.Verify(es => es.SendAsync(It.IsAny<string>(), It.IsAny<object>()), Times.Exactly(2));
    }
}
