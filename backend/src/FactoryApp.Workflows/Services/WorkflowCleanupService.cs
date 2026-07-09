using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace FactoryApp.Workflows.Services;

/// <summary>
/// Phase 6: Workflow Cleanup Service
/// Implements retention policy: keeps 30 days of workflow history.
/// Removes old workflow instances and history records.
/// Runs daily at midnight.
/// </summary>
public class WorkflowCleanupService : IHostedService
{
    private readonly IWorkflowHistoryStore _historyStore;
    private readonly ILogger<WorkflowCleanupService> _logger;
    private const int RetentionDays = 30;
    private Timer? _cleanupTimer;

    public WorkflowCleanupService(
        IWorkflowHistoryStore historyStore,
        ILogger<WorkflowCleanupService> logger)
    {
        _historyStore = historyStore;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Starting workflow cleanup service (retention: {RetentionDays} days)", RetentionDays);

        // Schedule cleanup to run daily at midnight
        var now = DateTime.UtcNow;
        var nextRun = now.Date.AddDays(1); // Next midnight
        var timeUntilNextRun = nextRun - now;

        _cleanupTimer = new Timer(
            async _ => await RunCleanupAsync(),
            null,
            timeUntilNextRun,
            TimeSpan.FromDays(1) // Repeat daily
        );

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _cleanupTimer?.Dispose();
        _logger.LogInformation("Workflow cleanup service stopped");
        return Task.CompletedTask;
    }

    private async Task RunCleanupAsync()
    {
        try
        {
            _logger.LogInformation("Running workflow cleanup job (retention: {RetentionDays} days)", RetentionDays);

            // Remove workflow history older than retention period
            await _historyStore.CleanupOldHistoryAsync(RetentionDays);

            // TODO: Also remove old workflow instances from Elsa persistence store
            // when Elsa 3.7.1 APIs expose cleanup methods

            _logger.LogInformation("Workflow cleanup job completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running workflow cleanup job");
        }
    }
}
