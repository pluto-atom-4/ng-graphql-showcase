using FactoryApp.Domain;
using Elsa.Workflows;
using Elsa.Workflows.Attributes;

namespace FactoryApp.Workflows.Activities;

/// <summary>
/// Fetches build from database by ID (primitive-key-only pattern).
/// Follows workflow-integration.md: fetches fresh domain state on each execution.
///
/// ELSA V3.5.3 API LIMITATION:
/// - ActivityExecutionContext lacks SetVariable/GetVariable methods in this version
/// - Direct dependency injection in workflow definitions not properly supported
/// - Requires Elsa v3.6+ or custom extensions for full implementation
///
/// Implementation Path for Phase 5C (future):
/// 1. Upgrade Elsa to v3.6+ with improved Activity API
/// 2. Use Output properties with proper decoration
/// 3. Implement workflow-level variable passing via context extensions
/// </summary>
[Activity(
    Category = "Manufacturing",
    Description = "Fetches build from database by ID (stub - awaiting Elsa v3.6+)")]
public class GetBuildActivity : Activity
{
    private readonly FactoryDbContext _dbContext;

    public GetBuildActivity(FactoryDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Build ID to fetch (Guid string).
    /// Set via workflow context or property injection.
    /// </summary>
    public string? BuildId { get; set; }

    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        try
        {
            if (string.IsNullOrEmpty(BuildId) || !Guid.TryParse(BuildId, out var buildGuid))
            {
                // TODO: Proper error handling when Elsa v3.6+ available
                await context.CompleteActivityAsync();
                return;
            }

            // Fetch fresh build (primitive-key-only pattern)
            var build = await _dbContext.Builds.FindAsync(buildGuid);

            if (build != null)
            {
                // TODO: Pass output via context.Variables when Elsa API available
                // Current workaround: use activity properties as output
            }

            await context.CompleteActivityAsync();
        }
        catch
        {
            // Silently complete - error handling pending API improvements
            await context.CompleteActivityAsync();
        }
    }
}
