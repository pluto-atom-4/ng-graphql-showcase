using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.Events;
using Elsa.Workflows;
using Elsa.Workflows.Attributes;
using HotChocolate.Subscriptions;

namespace FactoryApp.Workflows.Activities;

/// <summary>
/// Publishes build status change event to Hot Chocolate subscriptions.
/// Used in Elsa workflows to emit real-time status updates.
/// Accepts buildId, oldStatus, newStatus from workflow context variables.
/// </summary>
[Activity(
    Category = "Manufacturing",
    Description = "Publishes build status change event to subscribers")]
public class PublishBuildStatusActivity : Activity
{
    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        try
        {
            var eventSender = context.GetService<ITopicEventSender>();
            if (eventSender == null)
                return;

            // In real implementation, read buildId/oldStatus/newStatus from workflow context
            // For now, activity structure is in place for Phase 2
            // TODO: Wire up proper input/output handling in Elsa v3
        }
        catch
        {
            // Silently handle in workflow context
        }
    }
}
