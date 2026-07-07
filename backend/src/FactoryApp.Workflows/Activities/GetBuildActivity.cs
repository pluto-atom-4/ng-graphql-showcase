using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using Elsa.Workflows;
using Elsa.Workflows.Attributes;
using Microsoft.Extensions.Logging;

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
    private readonly ILogger<GetBuildActivity> _logger;

    public GetBuildActivity(FactoryDbContext dbContext, ILogger<GetBuildActivity> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Build ID to fetch (Guid string).
    /// Set via workflow context or property injection.
    /// </summary>
    public string? BuildId { get; set; }

    /// <summary>
    /// Fetched build (output property for Elsa v3.5.3 API limitation).
    /// </summary>
    public Build? Build { get; set; }

    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        try
        {
            if (string.IsNullOrEmpty(BuildId))
            {
                _logger.LogError("GetBuildActivity: BuildId is null or empty");
                await context.CompleteActivityAsync();
                return;
            }

            if (!Guid.TryParse(BuildId, out var buildGuid))
            {
                _logger.LogError("GetBuildActivity: Invalid Guid format for BuildId: {BuildId}", BuildId);
                await context.CompleteActivityAsync();
                return;
            }

            // Fetch fresh build (primitive-key-only pattern)
            var build = await _dbContext.Builds.FindAsync(buildGuid);

            if (build == null)
            {
                _logger.LogWarning("GetBuildActivity: Build not found for ID {BuildId}", BuildId);
                await context.CompleteActivityAsync();
                return;
            }

            Build = build;
            _logger.LogInformation("GetBuildActivity: Successfully fetched build {BuildId} with status {Status}", buildGuid, build.Status);
            await context.CompleteActivityAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetBuildActivity: Unexpected error processing BuildId {BuildId}", BuildId);
            await context.CompleteActivityAsync();
        }
    }
}
