using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.Workflows.Services;

/// <summary>
/// Phase 6: Workflow History Store Service
/// Manages workflow execution history and state change tracking.
/// </summary>
public interface IWorkflowHistoryStore
{
    Task RecordEventAsync(Guid workflowInstanceId, WorkflowHistoryRecord record);
    Task<IEnumerable<WorkflowHistoryRecord>> GetHistoryAsync(Guid workflowInstanceId);
    Task<IEnumerable<WorkflowHistoryRecord>> GetRecentHistoryAsync(int days = 30);
    Task CleanupOldHistoryAsync(int retentionDays = 30);
}

public class WorkflowHistoryStore : IWorkflowHistoryStore
{
    private readonly FactoryDbContext _dbContext;

    public WorkflowHistoryStore(FactoryDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task RecordEventAsync(Guid workflowInstanceId, WorkflowHistoryRecord record)
    {
        record.WorkflowInstanceId = workflowInstanceId;
        _dbContext.Add(record);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<IEnumerable<WorkflowHistoryRecord>> GetHistoryAsync(Guid workflowInstanceId)
    {
        return await _dbContext.Set<WorkflowHistoryRecord>()
            .Where(h => h.WorkflowInstanceId == workflowInstanceId)
            .OrderBy(h => h.RecordedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<WorkflowHistoryRecord>> GetRecentHistoryAsync(int days = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-days);
        return await _dbContext.Set<WorkflowHistoryRecord>()
            .Where(h => h.RecordedAt >= cutoffDate)
            .OrderByDescending(h => h.RecordedAt)
            .ToListAsync();
    }

    public async Task CleanupOldHistoryAsync(int retentionDays = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);
        var oldRecords = await _dbContext.Set<WorkflowHistoryRecord>()
            .Where(h => h.RecordedAt < cutoffDate)
            .ToListAsync();

        if (oldRecords.Any())
        {
            _dbContext.RemoveRange(oldRecords);
            await _dbContext.SaveChangesAsync();
        }
    }
}
