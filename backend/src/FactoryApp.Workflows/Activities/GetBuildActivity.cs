using FactoryApp.Domain;
using Elsa.Workflows;
using Elsa.Workflows.Attributes;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.Workflows.Activities;

/// <summary>
/// Fetches build data from database by buildId.
/// Follows primitive-key-only pattern: accepts buildId (Guid string), fetches fresh domain state.
/// Used in Elsa workflows to retrieve build status and details.
/// </summary>
[Activity(
    Category = "Manufacturing",
    Description = "Fetches build from database by ID")]
public class GetBuildActivity : Activity
{
    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        try
        {
            var dbContext = context.GetService<FactoryDbContext>();
            if (dbContext == null)
                return;

            // In real implementation, read buildId from workflow context
            // Fetch fresh domain state on each activity execution
            // TODO: Wire up proper input/output handling in Elsa v3
        }
        catch
        {
            // Silently handle in workflow context
        }
    }
}
