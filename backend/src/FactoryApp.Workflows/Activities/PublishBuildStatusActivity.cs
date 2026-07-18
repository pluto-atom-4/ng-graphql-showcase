using FactoryApp.Domain.Entities;
using FactoryApp.Domain.Events;
using Elsa.Workflows;
using Elsa.Workflows.Attributes;
using HotChocolate.Subscriptions;
using Microsoft.Extensions.Logging;

namespace FactoryApp.Workflows.Activities;

/// <summary>
/// Publishes build status change event to Hot Chocolate subscriptions.
/// Used in Elsa workflows to emit real-time status updates.
///
/// ELSA V3.5.3 API LIMITATION:
/// - ActivityExecutionContext lacks GetVariable/SetVariable in this version
/// - Type conversion for complex properties requires workarounds
/// - Event publishing infrastructure (ITopicEventSender) working correctly
///
/// Implementation Path for Phase 5C (future):
/// 1. Upgrade Elsa to v3.6+ with improved context variable API
/// 2. Implement proper input/output binding
/// 3. Add workflow-level error handling and logging
/// </summary>
[Activity(
    Category = "Manufacturing",
    Description = "Publishes build status change event to subscribers (stub - awaiting Elsa v3.6+)")]
public class PublishBuildStatusActivity : Activity
{
    private ITopicEventSender? _eventSender;
    private ILogger<PublishBuildStatusActivity>? _logger;

    /// <summary>
    /// Parameterless constructor for workflow definitions.
    /// </summary>
    public PublishBuildStatusActivity()
    {
    }

    /// <summary>
    /// DI constructor for service-based instantiation.
    /// </summary>
    public PublishBuildStatusActivity(ITopicEventSender eventSender, ILogger<PublishBuildStatusActivity> logger)
    {
        _eventSender = eventSender;
        _logger = logger;
    }

    /// <summary>
    /// Build ID to publish event for (string Guid).
    /// </summary>
    public string? BuildId { get; set; }

    /// <summary>
    /// New build status (string enum value).
    /// </summary>
    public string? NewStatus { get; set; }

    /// <summary>
    /// Previous build status (optional).
    /// </summary>
    public string? OldStatus { get; set; }

    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        try
        {
            if (_eventSender == null || _logger == null)
            {
                // Stub implementation for workflow definitions without DI
                BuildId = BuildId ?? string.Empty;
                NewStatus = NewStatus ?? string.Empty;
                await context.CompleteActivityAsync();
                return;
            }

            if (string.IsNullOrEmpty(BuildId))
            {
                _logger.LogError("PublishBuildStatusActivity: BuildId is null or empty");
                await context.CompleteActivityAsync();
                return;
            }

            if (string.IsNullOrEmpty(NewStatus))
            {
                _logger.LogError("PublishBuildStatusActivity: NewStatus is null or empty");
                await context.CompleteActivityAsync();
                return;
            }

            if (!Guid.TryParse(BuildId, out var buildGuid))
            {
                _logger.LogError("PublishBuildStatusActivity: Invalid Guid format for BuildId: {BuildId}", BuildId);
                await context.CompleteActivityAsync();
                return;
            }

            // Parse enum statuses with validation
            if (!Enum.TryParse<BuildStatus>(NewStatus, out var newStatus))
            {
                _logger.LogError("PublishBuildStatusActivity: Invalid BuildStatus value: {NewStatus}", NewStatus);
                await context.CompleteActivityAsync();
                return;
            }

            var oldStatus = !string.IsNullOrEmpty(OldStatus) && Enum.TryParse<BuildStatus>(OldStatus, out var parsed)
                ? parsed
                : BuildStatus.Pending;

            // Publish subscription event (infrastructure verified working)
            var @event = new BuildStatusChangedEvent
            {
                BuildId = buildGuid,
                OldStatus = oldStatus,
                NewStatus = newStatus,
                Timestamp = DateTime.UtcNow
            };

            // Send to Hot Chocolate subscribers
            await _eventSender.SendAsync(nameof(BuildStatusChangedEvent), @event);
            _logger.LogInformation("PublishBuildStatusActivity: Published status change for build {BuildId} from {OldStatus} to {NewStatus}", buildGuid, oldStatus, newStatus);

            await context.CompleteActivityAsync();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "PublishBuildStatusActivity: Unexpected error processing BuildId {BuildId}", BuildId);
            await context.CompleteActivityAsync();
        }
    }
}
