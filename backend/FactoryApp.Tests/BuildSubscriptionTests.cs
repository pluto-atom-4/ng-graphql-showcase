using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL;
using FactoryApp.GraphQL.Events;
using FactoryApp.GraphQL.Services;
using FactoryApp.Tests.Fixtures;
using FactoryApp.Tests.Mocks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Xunit;

namespace FactoryApp.Tests;

public class BuildSubscriptionTests : IAsyncLifetime
{
    private TestDatabaseFixture _fixture = null!;
    private FactoryDbContext _context = null!;
    private BuildMutationType _mutation = null!;
    private BuildSubscription _subscription = null!;
    private MockTopicEventSender _eventSender = null!;
    private LoggingService _loggingService = null!;
    private AuthService _authService = null!;

    public async Task InitializeAsync()
    {
        _fixture = new TestDatabaseFixture();
        await _fixture.InitializeAsync();
        _context = _fixture.GetContext();

        _eventSender = new MockTopicEventSender();

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
        _subscription = new BuildSubscription();
    }

    public async Task DisposeAsync()
    {
        await _fixture.DisposeAsync();
    }

    [Fact]
    public async Task UpdateBuildStatus_EmitsEvent_ToEventSender()
    {
        var build = _context.Builds.First();
        var buildId = build.Id;
        var oldStatus = build.Status;

        var result = await _mutation.UpdateBuildStatus(
            buildId,
            BuildStatus.Running,
            _context,
            _eventSender,
            _loggingService
        );

        Assert.NotNull(result);
        Assert.Equal("RUNNING", result.Status);
        Assert.Single(_eventSender.SentMessages);
        Assert.Equal("buildStatusChanged", _eventSender.SentMessages[0].Topic);

        var sentEvent = _eventSender.SentMessages[0].Message as BuildStatusChangedEvent;
        Assert.NotNull(sentEvent);
        Assert.Equal(buildId, sentEvent.BuildId);
        Assert.Equal(oldStatus, sentEvent.OldStatus);
        Assert.Equal(BuildStatus.Running, sentEvent.NewStatus);
    }

    [Fact]
    public async Task SubscriptionResolver_FiltersEventsByBuildId()
    {
        var build = _context.Builds.First();
        var buildId = build.Id;
        var otherBuildId = Guid.NewGuid();

        var statusChangedEvent = new BuildStatusChangedEvent
        {
            BuildId = buildId,
            OldStatus = BuildStatus.Pending,
            NewStatus = BuildStatus.Running,
            Timestamp = DateTime.UtcNow
        };

        var updates = new List<BuildStatusUpdate>();
        await foreach (var update in _subscription.BuildStatusUpdated(buildId, statusChangedEvent))
        {
            updates.Add(update);
        }

        Assert.Single(updates);
        Assert.Equal(buildId, updates[0].BuildId);
        Assert.Equal(BuildStatus.Pending, updates[0].OldStatus);
        Assert.Equal(BuildStatus.Running, updates[0].NewStatus);
    }

    [Fact]
    public async Task SubscriptionResolver_IgnoresOtherBuildIds()
    {
        var buildId = Guid.NewGuid();
        var otherBuildId = Guid.NewGuid();

        var statusChangedEvent = new BuildStatusChangedEvent
        {
            BuildId = otherBuildId,
            OldStatus = BuildStatus.Pending,
            NewStatus = BuildStatus.Running,
            Timestamp = DateTime.UtcNow
        };

        var updates = new List<BuildStatusUpdate>();
        await foreach (var update in _subscription.BuildStatusUpdated(buildId, statusChangedEvent))
        {
            updates.Add(update);
        }

        Assert.Empty(updates);
    }

    [Fact]
    public async Task SubmitTestRun_EmitsTestRunCompletedEvent()
    {
        var build = _context.Builds.First();
        var buildId = build.Id;

        var result = await _mutation.SubmitTestRun(
            buildId,
            TestStatus.Passed,
            "All tests passed",
            "http://example.com/result.txt",
            _context,
            _eventSender,
            _loggingService
        );

        Assert.NotNull(result);
        Assert.Equal(TestStatus.Passed, result.Status);
        Assert.Single(_eventSender.SentMessages);
        Assert.Equal("testRunCompleted", _eventSender.SentMessages[0].Topic);

        var sentEvent = _eventSender.SentMessages[0].Message as TestRunCompletedEvent;
        Assert.NotNull(sentEvent);
        Assert.Equal(buildId, sentEvent.BuildId);
        Assert.Equal(TestStatus.Passed, sentEvent.Status);
    }

    [Fact]
    public async Task TestRunSubscriptionResolver_FiltersEventsByBuildId()
    {
        var build = _context.Builds.First();
        var buildId = build.Id;

        var testRunEvent = new TestRunCompletedEvent
        {
            TestRunId = Guid.NewGuid(),
            BuildId = buildId,
            Status = TestStatus.Passed,
            Timestamp = DateTime.UtcNow
        };

        var updates = new List<TestRunUpdate>();
        await foreach (var update in _subscription.TestRunCompleted(buildId, testRunEvent))
        {
            updates.Add(update);
        }

        Assert.Single(updates);
        Assert.Equal(buildId, updates[0].BuildId);
        Assert.Equal(TestStatus.Passed, updates[0].Status);
    }
}
