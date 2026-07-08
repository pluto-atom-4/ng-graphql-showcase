using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.Tests.Workflows;

public class BuildProcessWorkflowPersistenceTests : IAsyncLifetime
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
    public async Task Workflow_StatePersisted_SurvivesDbReload()
    {
        // Arrange: Create and save build
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Persistence Test",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = new List<Part> { new Part { Id = Guid.NewGuid(), BuildId = buildId, Name = "Part", SKU = "SKU-001", Quantity = 1 } }
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Update status and persist
        var fetched = await _dbContext.Builds.FindAsync(buildId);
        fetched!.Status = BuildStatus.Running;
        fetched.UpdatedAt = DateTime.UtcNow;
        _dbContext.Builds.Update(fetched);
        await _dbContext.SaveChangesAsync();

        // Simulate context disposal and reload
        _dbContext.Dispose();

        var options = new DbContextOptionsBuilder<FactoryDbContext>()
            .UseSqlServer(TestConstants.TestConnectionString)
            .Options;
        _dbContext = new FactoryDbContext(options);

        // Assert: State persisted across context reload
        var reloaded = await _dbContext.Builds.FindAsync(buildId);
        Assert.NotNull(reloaded);
        Assert.Equal(BuildStatus.Running, reloaded.Status);
    }

    [Fact]
    public async Task Workflow_BuildHistory_CreatedAtAndUpdatedAtTracked()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var build = new Build
        {
            Id = buildId,
            Name = "History Tracking",
            Status = BuildStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Query history
        var fetched = await _dbContext.Builds.FindAsync(buildId);

        // Assert: Timestamps tracked
        Assert.NotNull(fetched?.CreatedAt);
        Assert.NotNull(fetched?.UpdatedAt);
        Assert.True(fetched!.CreatedAt <= now.AddMilliseconds(100)); // Allow small variance
        Assert.True(fetched.UpdatedAt <= now.AddMilliseconds(100));
    }

    [Fact]
    public async Task Workflow_MultipleStatusUpdates_AllPersisted()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Multiple Updates",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Multiple status transitions
        var statusChanges = new[] { BuildStatus.Running, BuildStatus.Complete, BuildStatus.Complete };
        foreach (var newStatus in statusChanges)
        {
            var current = await _dbContext.Builds.FindAsync(buildId);
            current!.Status = newStatus;
            current.UpdatedAt = DateTime.UtcNow;
            _dbContext.Builds.Update(current);
            await _dbContext.SaveChangesAsync();

            // Verify persisted immediately
            var verified = await _dbContext.Builds.FindAsync(buildId);
            Assert.Equal(newStatus, verified?.Status);
        }

        // Assert: Final state correct
        var final = await _dbContext.Builds.FindAsync(buildId);
        Assert.Equal(BuildStatus.Complete, final?.Status);
    }

    [Fact]
    public async Task Workflow_WorkflowInstanceData_PersistsAndQueried()
    {
        // Arrange: Create build representing workflow execution
        var buildId = Guid.NewGuid();
        var workflowInstanceId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = $"Workflow-{workflowInstanceId}",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Query by workflow identifier
        var found = await _dbContext.Builds
            .FirstOrDefaultAsync(b => b.Name.Contains(workflowInstanceId.ToString()));

        // Assert: Workflow data queryable
        Assert.NotNull(found);
        Assert.Equal(buildId, found.Id);
        Assert.Equal(BuildStatus.Pending, found.Status);
    }

    [Fact]
    public async Task Workflow_BuildWithParts_RelationshipsPersisted()
    {
        // Arrange: Build with multiple parts
        var buildId = Guid.NewGuid();
        var partIds = new[] { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };
        var build = new Build
        {
            Id = buildId,
            Name = "Build With Parts",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Parts = partIds.Select(partId => new Part
            {
                Id = partId,
                BuildId = buildId,
                Name = $"Part-{partId}",
                SKU = $"SKU-{partId}",
                Quantity = 10
            }).ToList()
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Reload with relationships
        var reloaded = await _dbContext.Builds
            .Include(b => b.Parts)
            .FirstOrDefaultAsync(b => b.Id == buildId);

        // Assert: Relationships persisted
        Assert.NotNull(reloaded);
        Assert.Equal(3, reloaded.Parts.Count);
        Assert.All(reloaded.Parts, p => Assert.Equal(buildId, p.BuildId));
    }

    [Fact]
    public async Task Workflow_QueryByStatus_ReturnsCorrectBuilds()
    {
        // Arrange: Create builds with different statuses
        var buildIds = new[]
        {
            (Guid.NewGuid(), BuildStatus.Pending),
            (Guid.NewGuid(), BuildStatus.Running),
            (Guid.NewGuid(), BuildStatus.Complete)
        };

        foreach (var (id, status) in buildIds)
        {
            var build = new Build
            {
                Id = id,
                Name = $"Build-{status}",
                Status = status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _dbContext.Builds.Add(build);
        }
        await _dbContext.SaveChangesAsync();

        // Act: Query by status
        var pending = await _dbContext.Builds.Where(b => b.Status == BuildStatus.Pending).CountAsync();
        var running = await _dbContext.Builds.Where(b => b.Status == BuildStatus.Running).CountAsync();
        var released = await _dbContext.Builds.Where(b => b.Status == BuildStatus.Complete).CountAsync();

        // Assert: Queries return correct results
        Assert.True(pending >= 1);
        Assert.True(running >= 1);
        Assert.True(released >= 1);
    }

    [Fact]
    public async Task Workflow_StateRecovery_FindsIncompleteWorkflows()
    {
        // Arrange: Create builds in various states
        var incompleteStatuses = new[] { BuildStatus.Pending, BuildStatus.Running };
        var incompleteBuilds = incompleteStatuses.Select(status => new Build
        {
            Id = Guid.NewGuid(),
            Name = $"Incomplete-{status}",
            Status = status,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }).ToList();

        _dbContext.Builds.AddRange(incompleteBuilds);
        await _dbContext.SaveChangesAsync();

        // Act: Query for incomplete builds (recovery scenario)
        var incomplete = await _dbContext.Builds
            .Where(b => b.Status == BuildStatus.Pending || b.Status == BuildStatus.Running)
            .ToListAsync();

        // Assert: Recovery finds all incomplete workflows
        Assert.NotEmpty(incomplete);
        Assert.All(incomplete, b => Assert.True(b.Status == BuildStatus.Pending || b.Status == BuildStatus.Running));
    }

    [Fact]
    public async Task Workflow_SequentialUpdates_BothPersisted()
    {
        // Arrange
        var buildId = Guid.NewGuid();
        var build = new Build
        {
            Id = buildId,
            Name = "Sequential Update",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _dbContext.Builds.Add(build);
        await _dbContext.SaveChangesAsync();

        // Act: Two sequential status updates in same context
        var fetched = await _dbContext.Builds.FindAsync(buildId);

        // Update 1
        fetched!.Status = BuildStatus.Running;
        fetched.UpdatedAt = DateTime.UtcNow;
        _dbContext.Builds.Update(fetched);
        await _dbContext.SaveChangesAsync();

        // Update 2
        fetched.Status = BuildStatus.Complete;
        fetched.UpdatedAt = DateTime.UtcNow;
        _dbContext.Builds.Update(fetched);
        await _dbContext.SaveChangesAsync();

        // Assert: Last update persisted
        var final = await _dbContext.Builds.FindAsync(buildId);
        Assert.Equal(BuildStatus.Complete, final?.Status);
    }
}
