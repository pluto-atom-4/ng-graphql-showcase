using FactoryApp.GraphQL.Events;
using Elsa.Workflows;
using Elsa.Workflows.Attributes;
using HotChocolate.Subscriptions;
using Microsoft.Extensions.Logging;

namespace FactoryApp.Workflows.Activities;

/// <summary>
/// Publishes test run trigger event to start testing process.
/// Generates a test run ID and broadcasts to subscribers.
/// </summary>
[Activity(
    Category = "Manufacturing",
    Description = "Trigger test run for a build")]
public class TriggerTestRunActivity : Activity
{
    private ITopicEventSender? _eventSender;
    private ILogger<TriggerTestRunActivity>? _logger;

    /// <summary>
    /// Parameterless constructor for workflow definitions.
    /// </summary>
    public TriggerTestRunActivity()
    {
    }

    /// <summary>
    /// DI constructor for service-based instantiation.
    /// </summary>
    public TriggerTestRunActivity(ITopicEventSender eventSender, ILogger<TriggerTestRunActivity> logger)
    {
        _eventSender = eventSender;
        _logger = logger;
    }

    /// <summary>
    /// Build ID to trigger test run for (Guid string).
    /// </summary>
    public string? BuildId { get; set; }

    /// <summary>
    /// Output: Generated test run ID (UUID string).
    /// </summary>
    public string? TestRunId { get; set; }

    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        try
        {
            if (_eventSender == null || _logger == null)
            {
                // Stub implementation for workflow definitions without DI
                TestRunId = Guid.NewGuid().ToString();
                await context.CompleteActivityAsync();
                return;
            }

            if (string.IsNullOrEmpty(BuildId))
            {
                _logger.LogError("TriggerTestRunActivity: BuildId is null or empty");
                await context.CompleteActivityAsync();
                return;
            }

            if (!Guid.TryParse(BuildId, out var buildGuid))
            {
                _logger.LogError("TriggerTestRunActivity: Invalid Guid format for BuildId: {BuildId}", BuildId);
                await context.CompleteActivityAsync();
                return;
            }

            // Generate unique test run ID
            var testRunId = Guid.NewGuid().ToString();
            TestRunId = testRunId;

            // Publish event to subscribers (Hot Chocolate subscriptions)
            var @event = new TestRunTriggeredEvent
            {
                BuildId = buildGuid,
                TestRunId = testRunId,
                Timestamp = DateTime.UtcNow
            };

            await _eventSender.SendAsync($"testRunTriggered_{BuildId}", @event);
            _logger.LogInformation("TriggerTestRunActivity: Published test trigger for build {BuildId}, TestRunId {TestRunId}", buildGuid, testRunId);

            await context.CompleteActivityAsync();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "TriggerTestRunActivity: Unexpected error processing BuildId {BuildId}", BuildId);
            await context.CompleteActivityAsync();
        }
    }
}
