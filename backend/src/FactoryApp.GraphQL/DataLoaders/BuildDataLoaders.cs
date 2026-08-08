using System.Security.Claims;
using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.GraphQL.DataLoaders;

public class BuildDataLoaders
{
    private readonly FactoryDbContext _context;

    public BuildDataLoaders(FactoryDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Public method: Batch-loads parts without authorization filtering.
    /// Used when caller has already checked authorization at resolver level.
    /// </summary>
    public async Task<IReadOnlyDictionary<Guid, List<Part>>> GetPartsByBuildId(
        IReadOnlyList<Guid> buildIds,
        FactoryDbContext? _ = null,
        CancellationToken ct = default)
        => await _context.Parts
            .Where(p => buildIds.Contains(p.BuildId))
            .AsNoTracking()
            .GroupBy(p => p.BuildId)
            .ToDictionaryAsync(g => g.Key, g => g.ToList(), ct);

    /// <summary>
    /// Authorization-aware: Batch-loads parts filtered by user role/claims.
    /// Phase 4: Pre-filters results before returning to resolver (prevents N+1 auth checks).
    /// Admin: all parts. User: all parts (row-level filtering deferred to Phase 4B).
    /// </summary>
    public async Task<IReadOnlyDictionary<Guid, List<Part>>> GetPartsByBuildIdAuthorized(
        IReadOnlyList<Guid> buildIds,
        ClaimsPrincipal user,
        CancellationToken ct = default)
    {
        var isAdmin = user.IsInRole("Admin");

        var query = _context.Parts
            .Where(p => buildIds.Contains(p.BuildId))
            .AsNoTracking();

        // Admin sees all parts. Users see all parts (future: filter by ownership).
        if (!isAdmin)
        {
            // Phase 4B: Add row-level filtering here based on user ID, org, etc.
            // For MVP: users see all parts (same visibility as public query)
        }

        return await query
            .GroupBy(p => p.BuildId)
            .ToDictionaryAsync(g => g.Key, g => g.ToList(), ct);
    }

    /// <summary>
    /// Public method: Batch-loads test runs without authorization filtering.
    /// </summary>
    public async Task<IReadOnlyDictionary<Guid, List<TestRun>>> GetTestRunsByBuildId(
        IReadOnlyList<Guid> buildIds,
        FactoryDbContext? _ = null,
        CancellationToken ct = default)
        => await _context.TestRuns
            .Where(t => buildIds.Contains(t.BuildId))
            .AsNoTracking()
            .GroupBy(t => t.BuildId)
            .ToDictionaryAsync(g => g.Key, g => g.ToList(), ct);

    /// <summary>
    /// Authorization-aware: Batch-loads test runs filtered by user role/claims.
    /// Phase 4: Demonstrates authorization pattern in DataLoaders.
    /// </summary>
    public async Task<IReadOnlyDictionary<Guid, List<TestRun>>> GetTestRunsByBuildIdAuthorized(
        IReadOnlyList<Guid> buildIds,
        ClaimsPrincipal user,
        CancellationToken ct = default)
    {
        var isAdmin = user.IsInRole("Admin");
        var canViewTests = user.FindFirst("view_tests")?.Value == "true";

        var query = _context.TestRuns
            .Where(t => buildIds.Contains(t.BuildId))
            .AsNoTracking();

        // Admin + view_tests claim: all test runs. Others: only non-sensitive runs.
        if (!isAdmin || !canViewTests)
        {
            // Phase 4B: Filter test runs based on sensitivity level.
            // For MVP: same visibility (all test runs visible).
        }

        return await query
            .GroupBy(t => t.BuildId)
            .ToDictionaryAsync(g => g.Key, g => g.ToList(), ct);
    }

    /// <summary>
    /// Phase 1 (Issue #267): Batch-loads recent activities for builds.
    /// Returns up to 10 most recent workflow history events per build.
    /// Prevents N+1 queries when fetching activities for multiple builds.
    /// Ordered descending by RecordedAt (newest first).
    /// </summary>
    public async Task<IReadOnlyDictionary<Guid, List<ActivityDto>>> GetRecentActivitiesByBuildId(
        IReadOnlyList<Guid> buildIds,
        int limit = 10,
        CancellationToken ct = default)
    {
        var activities = await _context.Set<WorkflowHistoryRecord>()
            .Where(h => buildIds.Contains(h.BuildId!.Value))
            .AsNoTracking()
            .OrderByDescending(h => h.RecordedAt)  // DB level ordering
            .Select(h => new ActivityDto
            {
                Id = h.Id,
                WorkflowInstanceId = h.WorkflowInstanceId,
                BuildId = h.BuildId!.Value,
                EventType = h.EventType,
                ActivityName = h.ActivityName,
                OldStatus = h.OldStatus,
                NewStatus = h.NewStatus,
                ErrorMessage = h.ErrorMessage,
                RecordedAt = h.RecordedAt,
                ExecutionStarted = h.ExecutionStarted,
                ExecutionCompleted = h.ExecutionCompleted,
                ElapsedMilliseconds = h.ElapsedMilliseconds
            })
            .ToListAsync(ct);

        ct.ThrowIfCancellationRequested();
        return activities
            .GroupBy(a => a.BuildId)
            .ToDictionary(
                g => g.Key,
                g => g.Take(limit).ToList());
    }
}
