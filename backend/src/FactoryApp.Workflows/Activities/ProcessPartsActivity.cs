using FactoryApp.Domain;
using Elsa.Workflows;
using Elsa.Workflows.Attributes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FactoryApp.Workflows.Activities;

/// <summary>
/// Validates that parts exist for a build.
/// Follows primitive-key-only pattern: fetches fresh data on each execution.
/// </summary>
[Activity(
    Category = "Manufacturing",
    Description = "Validate parts exist for a build")]
public class ProcessPartsActivity : Activity
{
    private FactoryDbContext? _dbContext;
    private ILogger<ProcessPartsActivity>? _logger;

    /// <summary>
    /// Parameterless constructor for workflow definitions.
    /// </summary>
    public ProcessPartsActivity()
    {
    }

    /// <summary>
    /// DI constructor for service-based instantiation.
    /// </summary>
    public ProcessPartsActivity(FactoryDbContext dbContext, ILogger<ProcessPartsActivity> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Build ID to process parts for (Guid string).
    /// </summary>
    public string? BuildId { get; set; }

    /// <summary>
    /// Output: Whether all required parts are available.
    /// </summary>
    public bool PartsValid { get; set; }

    protected override async ValueTask ExecuteAsync(ActivityExecutionContext context)
    {
        try
        {
            if (_dbContext == null || _logger == null)
            {
                // Stub implementation for workflow definitions without DI
                BuildId = BuildId ?? string.Empty;
                PartsValid = false;
                await context.CompleteActivityAsync();
                return;
            }

            if (string.IsNullOrEmpty(BuildId))
            {
                _logger.LogError("ProcessPartsActivity: BuildId is null or empty");
                PartsValid = false;
                await context.CompleteActivityAsync();
                return;
            }

            if (!Guid.TryParse(BuildId, out var buildGuid))
            {
                _logger.LogError("ProcessPartsActivity: Invalid Guid format for BuildId: {BuildId}", BuildId);
                PartsValid = false;
                await context.CompleteActivityAsync();
                return;
            }

            // Fetch fresh build with parts (primitive-key-only pattern)
            var build = await _dbContext.Builds
                .Include(b => b.Parts)
                .FirstOrDefaultAsync(b => b.Id == buildGuid);

            if (build == null)
            {
                _logger.LogWarning("ProcessPartsActivity: Build not found for ID {BuildId}", BuildId);
                PartsValid = false;
                await context.CompleteActivityAsync();
                return;
            }

            // Validate parts exist
            PartsValid = build.Parts != null && build.Parts.Count > 0;

            _logger.LogInformation(
                "ProcessPartsActivity: Processed parts for build {BuildId}, PartsValid={PartsValid}, PartCount={PartCount}",
                buildGuid,
                PartsValid,
                build.Parts?.Count ?? 0);

            await context.CompleteActivityAsync();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "ProcessPartsActivity: Unexpected error processing BuildId {BuildId}", BuildId);
            PartsValid = false;
            await context.CompleteActivityAsync();
        }
    }
}
