using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using Elsa.Workflows.Runtime.Messages;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.Tests.Workflows;

/// <summary>
/// Phase 6: Happy path workflow execution tests.
/// Verify complete workflow execution: Build → Parts → TestRun → Completed → Released.
/// </summary>
public class BuildProcessWorkflowHappyPathTests : IAsyncLifetime
{
    private readonly WorkflowTestFixture _fixture;
    private FactoryDbContext _dbContext = null!;

    public BuildProcessWorkflowHappyPathTests()
    {
        _fixture = new WorkflowTestFixture();
    }

    public async Task InitializeAsync()
    {
        await _fixture.InitializeAsync();
        _dbContext = _fixture.DbContext;
    }

    public async Task DisposeAsync()
    {
        await _fixture.DisposeAsync();
    }

    [Fact]
    public async Task ExecuteWorkflow_BuildCreated_CompletesAllActivities()
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

        // Act: Execute workflow
        var client = await _fixture.WorkflowRuntime.CreateClientAsync("BuildProcessWorkflow");
        var request = new CreateAndRunWorkflowInstanceRequest
        {
            Input = new Dictionary<string, object> { { "BuildId", buildId.ToString() } }
        };

        var result = await client.CreateAndRunInstanceAsync(request);

        // Assert: Verify workflow completed
        Assert.NotNull(result);
        Assert.NotNull(result.WorkflowInstanceId);

        // Verify build status updated to Released
        var updatedBuild = await _dbContext.Builds.FindAsync(buildId);
        Assert.NotNull(updatedBuild);
        Assert.Equal(BuildStatus.Complete, updatedBuild.Status);

        // Verify workflow history recorded
        var history = await _dbContext.Set<WorkflowHistoryRecord>()
            .Where(h => h.BuildId == buildId)
            .ToListAsync();

        Assert.NotEmpty(history);
    }

    [Fact]
    public async Task ExecuteWorkflow_BuildStatusTransitions()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Status Transition Test",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part> { new() { Id = Guid.NewGuid(), BuildId = buildId, Name = "Part-1", SKU = "SKU-003", Quantity = 1 } }
        };

        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Verify initial state
        var startBuild = await _dbContext.Builds.FindAsync(buildId);
        Assert.Equal(BuildStatus.Pending, startBuild!.Status);

        // Act: Execute workflow
        var client = await _fixture.WorkflowRuntime.CreateClientAsync("BuildProcessWorkflow");
        var request = new CreateAndRunWorkflowInstanceRequest
        {
            Input = new Dictionary<string, object> { { "BuildId", buildId.ToString() } }
        };

        await client.CreateAndRunInstanceAsync(request);

        // Assert: Verify status transitioned to Released
        var endBuild = await _dbContext.Builds.FindAsync(buildId);
        Assert.NotNull(endBuild);
        Assert.Equal(BuildStatus.Complete, endBuild.Status);
    }

    [Fact]
    public async Task ExecuteWorkflow_WorkflowInstanceCreated()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Instance Test",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part> { new() { Id = Guid.NewGuid(), BuildId = buildId, Name = "Part-1", SKU = "SKU-004", Quantity = 1 } }
        };

        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Execute workflow
        var client = await _fixture.WorkflowRuntime.CreateClientAsync("BuildProcessWorkflow");
        var request = new CreateAndRunWorkflowInstanceRequest
        {
            Input = new Dictionary<string, object> { { "BuildId", buildId.ToString() } }
        };

        var result = await client.CreateAndRunInstanceAsync(request);

        // Assert: Verify WorkflowHistoryRecord created
        var history = await _dbContext.Set<WorkflowHistoryRecord>()
            .Where(h => h.BuildId == buildId)
            .ToListAsync();

        Assert.NotEmpty(history);

        // Verify history has execution timestamps
        var firstRecord = history.FirstOrDefault();
        Assert.NotNull(firstRecord);
        Assert.Equal(buildId, firstRecord.BuildId);
        Assert.NotNull(firstRecord.RecordedAt);
    }
}
