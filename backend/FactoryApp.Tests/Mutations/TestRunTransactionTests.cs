using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL;
using FactoryApp.Tests.Collections;
using FactoryApp.Tests.Fixtures;
using FactoryApp.Tests.Mocks;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.Tests.Mutations;

[Collection("SQL Server Transaction Tests")]
public class TestRunTransactionTests
{
    private readonly TestDatabaseFixture _dbFixture;
    private readonly FactoryDbContext _context;
    private readonly BuildMutationType _mutation;
    private readonly MockTopicEventSender _mockEventSender;
    private readonly MockLoggingService _mockLogging;

    public TestRunTransactionTests(TestDatabaseFixture dbFixture)
    {
        _dbFixture = dbFixture;
        _context = _dbFixture.GetContext();
        _mutation = new BuildMutationType();
        _mockEventSender = new MockTopicEventSender();
        _mockLogging = new MockLoggingService();
    }

    /// <summary>
    /// Verify basic persistence—TestRun entity created in database with correct data.
    /// </summary>
    [Fact]
    public async Task SubmitTestRun_PersistsToDatabase()
    {
        // Arrange
        var buildId = new Guid("10000000-0000-0000-0000-000000000008");
        var testStatus = TestStatus.Passed;
        var result = "All assertions passed";
        var fileUrl = "https://example.com/results.json";

        // Act
        var response = await _mutation.SubmitTestRun(
            buildId, testStatus, result, fileUrl,
            _context, _mockEventSender, _mockLogging);

        // Assert - Query database directly
        var testRun = await _context.TestRuns
            .FirstOrDefaultAsync(t => t.BuildId == buildId && t.Status == testStatus);

        Assert.NotNull(testRun);
        Assert.Equal(testStatus, testRun.Status);
        Assert.Equal(result, testRun.Result);
        Assert.Equal(fileUrl, testRun.FileUrl);
        Assert.NotNull(testRun.CompletedAt);
        Assert.NotNull(testRun.CreatedAt);
    }

    /// <summary>
    /// Verify transaction rolls back on validation failure—no partial writes persist.
    /// </summary>
    [Fact]
    public async Task SubmitTestRun_ValidationRollsBackTransaction()
    {
        // Arrange
        var buildId = new Guid("10000000-0000-0000-0000-000000000008");
        var initialCount = await _context.TestRuns
            .Where(t => t.BuildId == buildId)
            .CountAsync();

        // Act
        var exception = await Assert.ThrowsAsync<GraphQLException>(async () =>
            await _mutation.SubmitTestRun(
                buildId, TestStatus.Failed, null, null,  // null result fails validation
                _context, _mockEventSender, _mockLogging));

        // Assert
        Assert.Contains("result is required", exception.Message, StringComparison.OrdinalIgnoreCase);

        // Verify no database write occurred
        var finalCount = await _context.TestRuns
            .Where(t => t.BuildId == buildId)
            .CountAsync();
        Assert.Equal(initialCount, finalCount);

        // Verify no partial data in database
        var testRun = await _context.TestRuns
            .FirstOrDefaultAsync(t => t.BuildId == buildId && t.Status == TestStatus.Failed);
        Assert.Null(testRun);
    }

    /// <summary>
    /// Verify event publishing happens after transaction commits.
    /// Event failure doesn't prevent TestRun from persisting (event is post-commit).
    /// </summary>
    [Fact]
    public async Task SubmitTestRun_RollsBackOnDatabaseError()
    {
        // Arrange
        var buildId = new Guid("10000000-0000-0000-0000-000000000008");

        var mockEventSenderWithFailure = new MockTopicEventSender
        {
            FailOnSend = true
        };

        // Act - Event sender throws after transaction commits
        var exception = await Assert.ThrowsAsync<GraphQLException>(async () =>
            await _mutation.SubmitTestRun(
                buildId, TestStatus.Passed, "Test", "https://example.com/file.json",
                _context, mockEventSenderWithFailure, _mockLogging));

        // Assert - Verify exception wraps the event sender failure
        Assert.Contains("Failed to submit test run", exception.Message);

        // Verify TestRun was persisted despite event failure (committed before event send)
        var testRun = await _context.TestRuns
            .FirstOrDefaultAsync(t => t.BuildId == buildId && t.Status == TestStatus.Passed);
        Assert.NotNull(testRun);
    }

    /// <summary>
    /// Verify timestamp logic—completedAt set for terminal states (PASSED/FAILED), null for RUNNING.
    /// </summary>
    [Fact]
    public async Task SubmitTestRun_CompletedAtTimestampCorrectness()
    {
        // Arrange
        var buildId = new Guid("10000000-0000-0000-0000-000000000008");
        var testStart = DateTime.UtcNow.AddSeconds(-1); // Allow 1s margin for clock skew

        // Act - PASSED status
        await _mutation.SubmitTestRun(
            buildId, TestStatus.Passed, "Pass", "https://example.com/1.json",
            _context, _mockEventSender, _mockLogging);

        // Assert - completedAt set and recent
        var passedRun = await _context.TestRuns
            .FirstOrDefaultAsync(t => t.BuildId == buildId && t.Status == TestStatus.Passed);
        Assert.NotNull(passedRun);
        Assert.NotNull(passedRun.CompletedAt);
        Assert.InRange(passedRun.CompletedAt.Value, testStart, DateTime.UtcNow.AddSeconds(1));

        // Act - RUNNING status
        await _mutation.SubmitTestRun(
            buildId, TestStatus.Running, null, null,
            _context, _mockEventSender, _mockLogging);

        // Assert - completedAt null for RUNNING
        var runningRun = await _context.TestRuns
            .Where(t => t.BuildId == buildId && t.Status == TestStatus.Running)
            .FirstOrDefaultAsync();
        Assert.NotNull(runningRun);
        Assert.Null(runningRun.CompletedAt);

        // Act - FAILED status with result
        await _mutation.SubmitTestRun(
            buildId, TestStatus.Failed, "Failed", "https://example.com/2.json",
            _context, _mockEventSender, _mockLogging);

        // Assert - completedAt set for FAILED
        var failedRun = await _context.TestRuns
            .FirstOrDefaultAsync(t => t.BuildId == buildId && t.Status == TestStatus.Failed);
        Assert.NotNull(failedRun);
        Assert.NotNull(failedRun.CompletedAt);
        Assert.InRange(failedRun.CompletedAt.Value, testStart, DateTime.UtcNow.AddSeconds(1));
    }

    /// <summary>
    /// Verify no lost writes when multiple TestRuns created for same build.
    /// </summary>
    [Fact]
    public async Task SubmitTestRun_MultipleRunsPerBuildPreservesAll()
    {
        // Arrange
        var buildId = new Guid("10000000-0000-0000-0000-000000000008");
        var runs = new[] { TestStatus.Passed, TestStatus.Failed, TestStatus.Running };
        var testRunIds = new List<Guid>();
        var countBefore = await _context.TestRuns
            .Where(t => t.BuildId == buildId)
            .CountAsync();

        // Act - Submit 3 test runs
        foreach (var status in runs)
        {
            var response = await _mutation.SubmitTestRun(
                buildId, status, "Result", status == TestStatus.Running ? null : "https://example.com/file.json",
                _context, _mockEventSender, _mockLogging);
            testRunIds.Add(response.Id);
        }

        // Assert - All 3 new records persisted
        var allRuns = await _context.TestRuns
            .Where(t => testRunIds.Contains(t.Id))
            .OrderBy(t => t.CreatedAt)
            .ToListAsync();

        Assert.Equal(3, allRuns.Count);
        Assert.Equal(TestStatus.Passed, allRuns[0].Status);
        Assert.Equal(TestStatus.Failed, allRuns[1].Status);
        Assert.Equal(TestStatus.Running, allRuns[2].Status);

        // Verify no lost writes
        Assert.All(allRuns, run => Assert.NotNull(run.CreatedAt));
        Assert.All(allRuns.Take(2), run => Assert.NotNull(run.CompletedAt));
        Assert.Null(allRuns[2].CompletedAt);  // Running has null
    }
}
