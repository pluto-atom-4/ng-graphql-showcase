using Elsa.Workflows;
using Elsa.Workflows.Attributes;
using Microsoft.Extensions.Logging;

namespace FactoryApp.Workflows.Activities;

/// <summary>
/// Awaits test completion event for a test run.
/// In current implementation (Elsa v3.5.3), this activity completes immediately.
/// Future Elsa v3.6+ versions will support async bookmarks for true async waiting.
/// See: workflow-integration.md for state management pattern.
/// </summary>
[Activity(
    Category = "Manufacturing",
    Description = "Wait for test run completion (stub - awaiting Elsa v3.6+ async bookmarks)")]
public class AwaitTestCompletionActivity : Activity
{
    private ILogger<AwaitTestCompletionActivity>? _logger;

    /// <summary>
    /// Parameterless constructor for workflow definitions.
    /// </summary>
    public AwaitTestCompletionActivity()
    {
    }

    /// <summary>
    /// DI constructor for service-based instantiation.
    /// </summary>
    public AwaitTestCompletionActivity(ILogger<AwaitTestCompletionActivity> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Test run ID to await completion for (string UUID).
    /// </summary>
    public string? TestRunId { get; set; }

    /// <summary>
    /// Output: Whether test run completed successfully.
    /// </summary>
    public bool TestRunCompleted { get; set; }

    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        try
        {
            if (string.IsNullOrEmpty(TestRunId))
            {
                _logger?.LogError("AwaitTestCompletionActivity: TestRunId is null or empty");
                TestRunCompleted = false;
                await context.CompleteActivityAsync();
                return;
            }

            _logger?.LogInformation("AwaitTestCompletionActivity: Waiting for test completion of TestRunId {TestRunId}", TestRunId);

            // TODO: Implement async bookmark-based waiting when Elsa v3.6+ is available
            // Current behavior: immediate completion (stub implementation)
            // Future: Subscribe to testRunCompleted event via Elsa bookmark API
            //
            // Elsa v3.5.3 limitation: ActivityExecutionContext lacks async bookmark support
            // Workaround: Application code (GraphQL mutation) will signal completion via event
            // See: BuildMutation.SubmitTestRun publishes TestRunCompletedEvent

            TestRunCompleted = true;
            await context.CompleteActivityAsync();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "AwaitTestCompletionActivity: Unexpected error awaiting TestRunId {TestRunId}", TestRunId);
            TestRunCompleted = false;
            await context.CompleteActivityAsync();
        }
    }
}
