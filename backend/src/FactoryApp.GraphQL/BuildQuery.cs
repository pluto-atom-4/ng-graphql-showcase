using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.DataLoaders;
using FactoryApp.GraphQL.DTOs;
using FactoryApp.GraphQL.Services;
using HotChocolate;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.GraphQL;

public class BuildQueryType
{
    /// <summary>
    /// Public query: All authenticated users can list builds.
    /// Phase 3 decision: Queries readable by default, filtering added in Phase 4.
    /// </summary>
    public IQueryable<Build> GetBuilds([Service] FactoryDbContext context)
        => context.Builds.AsNoTracking();

    public async Task<Build?> GetBuild(
        Guid id,
        [Service] FactoryDbContext context,
        [Service] LoggingService loggingService)
    {
        try
        {
            loggingService.LogQueryStart(nameof(GetBuild), new() { { "id", id } });

            var build = await context.Builds
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.Id == id);

            return build;
        }
        catch (Exception ex)
        {
            loggingService.LogQueryError(nameof(GetBuild), ex);
            throw new GraphQLException("Failed to fetch build", ex);
        }
    }

    public async Task<PaginatedBuilds> GetBuildsPaginated(
        int limit,
        int offset,
        [Service] FactoryDbContext context,
        [Service] LoggingService loggingService)
    {
        var args = new Dictionary<string, object?> { { "limit", limit }, { "offset", offset } };

        try
        {
            loggingService.LogQueryStart(nameof(GetBuildsPaginated), args);

            ValidationService.ValidatePaginationParams(limit, offset);

            var query = context.Builds.AsNoTracking();
            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.CreatedAt)
                .Skip(offset)
                .Take(limit)
                .ToListAsync();

            var hasNextPage = offset + limit < totalCount;
            var hasPreviousPage = offset > 0;

            return new PaginatedBuilds
            {
                Items = items,
                TotalCount = totalCount,
                HasNextPage = hasNextPage,
                HasPreviousPage = hasPreviousPage
            };
        }
        catch (GraphQLException)
        {
            throw;
        }
        catch (Exception ex)
        {
            loggingService.LogQueryError(nameof(GetBuildsPaginated), ex);
            throw new GraphQLException("Failed to fetch builds", ex);
        }
    }

    /// <summary>
    /// Admin-only query: Returns builds with internal metadata (audit, cost, etc.).
    /// Authorization: Requires "Admin" role (applied via @authorize directive in schema).
    /// </summary>
    public async Task<ICollection<Build>> GetBuildsAdmin(
        [Service] FactoryDbContext context,
        [Service] LoggingService loggingService)
    {
        try
        {
            loggingService.LogQueryStart(nameof(GetBuildsAdmin), new());

            var builds = await context.Builds
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return builds;
        }
        catch (Exception ex)
        {
            loggingService.LogQueryError(nameof(GetBuildsAdmin), ex);
            throw new GraphQLException("Failed to fetch admin builds", ex);
        }
    }

    /// <summary>
    /// Phase 1 (Issue #267): Get build metrics for dashboard.
    /// Returns aggregated counts of builds by status: total, inProgress, completed, failed, pending.
    /// </summary>
    public async Task<BuildMetricsDto> GetBuildMetrics(
        [Service] FactoryDbContext context,
        [Service] LoggingService loggingService)
    {
        var args = new Dictionary<string, object?>();

        try
        {
            loggingService.LogQueryStart(nameof(GetBuildMetrics), args);

            var builds = await context.Builds
                .AsNoTracking()
                .ToListAsync();

            var total = builds.Count;
            var inProgress = builds.Count(b => b.Status == BuildStatus.Running);
            var completed = builds.Count(b => b.Status == BuildStatus.Complete);
            var failed = builds.Count(b => b.Status == BuildStatus.Failed);
            var pending = builds.Count(b => b.Status == BuildStatus.Pending);

            return new BuildMetricsDto
            {
                Total = total,
                InProgress = inProgress,
                Completed = completed,
                Failed = failed,
                Pending = pending
            };
        }
        catch (Exception ex)
        {
            loggingService.LogQueryError(nameof(GetBuildMetrics), ex);
            throw new GraphQLException("Failed to fetch build metrics", ex);
        }
    }

    /// <summary>
    /// Phase 1 (Issue #267): Paginated builds query with sorting support.
    /// Parameters:
    ///   limit: Number of items per page (default 10, max 100)
    ///   offset: Number of items to skip (pagination offset)
    ///   sortBy: Sort field - "createdAt" or "status" (default "createdAt")
    ///   sortOrder: "asc" or "desc" (default "desc")
    /// </summary>
    public async Task<PaginatedBuilds> GetPaginatedBuildsWithSorting(
        [Service] FactoryDbContext context,
        [Service] LoggingService loggingService,
        int limit = 10,
        int offset = 0,
        string sortBy = "createdAt",
        string sortOrder = "desc")
    {
        var args = new Dictionary<string, object?>
        {
            { "limit", limit },
            { "offset", offset },
            { "sortBy", sortBy },
            { "sortOrder", sortOrder }
        };

        try
        {
            loggingService.LogQueryStart(nameof(GetPaginatedBuildsWithSorting), args);

            ValidationService.ValidatePaginationParams(limit, offset);

            if (limit > 100)
                throw new GraphQLException("Limit must be <= 100 for paginated builds");

            // Validate sort parameters
            if (sortBy != "createdAt" && sortBy != "status")
                throw new GraphQLException($"Invalid sortBy: {sortBy}. Must be 'createdAt' or 'status'");

            if (sortOrder != "asc" && sortOrder != "desc")
                throw new GraphQLException($"Invalid sortOrder: {sortOrder}. Must be 'asc' or 'desc'");

            var query = context.Builds.AsNoTracking();
            var totalCount = await query.CountAsync();

            // Apply sorting
            query = sortBy switch
            {
                "status" => sortOrder == "asc"
                    ? query.OrderBy(x => x.Status)
                    : query.OrderByDescending(x => x.Status),
                _ => sortOrder == "asc"
                    ? query.OrderBy(x => x.CreatedAt)
                    : query.OrderByDescending(x => x.CreatedAt)
            };

            var items = await query
                .Skip(offset)
                .Take(limit)
                .ToListAsync();

            var hasNextPage = offset + limit < totalCount;
            var hasPreviousPage = offset > 0;

            return new PaginatedBuilds
            {
                Items = items,
                TotalCount = totalCount,
                HasNextPage = hasNextPage,
                HasPreviousPage = hasPreviousPage
            };
        }
        catch (GraphQLException)
        {
            throw;
        }
        catch (Exception ex)
        {
            loggingService.LogQueryError(nameof(GetPaginatedBuildsWithSorting), ex);
            throw new GraphQLException("Failed to fetch paginated builds with sorting", ex);
        }
    }

    /// <summary>
    /// Phase 1 (Issue #267): Get recent activities for a specific build.
    /// Returns up to 10 most recent workflow history events for the build.
    /// </summary>
    public async Task<IEnumerable<ActivityDto>> GetRecentActivities(
        Guid buildId,
        [Service] FactoryDbContext context,
        [Service] BuildDataLoaders dataLoaders,
        [Service] LoggingService loggingService,
        int limit = 10,
        CancellationToken ct = default)
    {
        var args = new Dictionary<string, object?>
        {
            { "buildId", buildId },
            { "limit", limit }
        };

        try
        {
            loggingService.LogQueryStart(nameof(GetRecentActivities), args);

            // Use DataLoader to batch-load activities (prevents N+1)
            var activities = await dataLoaders.GetRecentActivitiesByBuildId(new[] { buildId }, limit, ct);
            return activities.TryGetValue(buildId, out var buildActivities)
                ? buildActivities
                : new List<ActivityDto>();
        }
        catch (Exception ex)
        {
            loggingService.LogQueryError(nameof(GetRecentActivities), ex);
            throw new GraphQLException("Failed to fetch recent activities", ex);
        }
    }

    // Phase 6: Workflow history queries
    /// <summary>
    /// Get workflow execution history for a build.
    /// </summary>
    public async Task<IEnumerable<WorkflowHistoryDto>> GetBuildWorkflowHistory(
        Guid buildId,
        [Service] FactoryDbContext context)
    {
        var history = await context.Set<WorkflowHistoryRecord>()
            .Where(h => h.BuildId == buildId)
            .OrderBy(h => h.RecordedAt)
            .Select(h => new WorkflowHistoryDto
            {
                Id = h.Id,
                WorkflowInstanceId = h.WorkflowInstanceId,
                BuildId = h.BuildId,
                EventType = h.EventType,
                ActivityName = h.ActivityName,
                OldStatus = h.OldStatus,
                NewStatus = h.NewStatus,
                StateSnapshot = h.StateSnapshot,
                ErrorMessage = h.ErrorMessage,
                RecordedAt = h.RecordedAt,
                ExecutionStarted = h.ExecutionStarted,
                ExecutionCompleted = h.ExecutionCompleted,
                ElapsedMilliseconds = h.ElapsedMilliseconds
            })
            .ToListAsync();

        return history;
    }

    /// <summary>
    /// Get recent workflow history (last N days).
    /// </summary>
    public async Task<IEnumerable<WorkflowHistoryDto>> GetRecentWorkflowHistory(
        [Service] FactoryDbContext context,
        int days = 7)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-days);

        var history = await context.Set<WorkflowHistoryRecord>()
            .Where(h => h.RecordedAt >= cutoffDate)
            .OrderByDescending(h => h.RecordedAt)
            .Select(h => new WorkflowHistoryDto
            {
                Id = h.Id,
                WorkflowInstanceId = h.WorkflowInstanceId,
                BuildId = h.BuildId,
                EventType = h.EventType,
                ActivityName = h.ActivityName,
                OldStatus = h.OldStatus,
                NewStatus = h.NewStatus,
                StateSnapshot = h.StateSnapshot,
                ErrorMessage = h.ErrorMessage,
                RecordedAt = h.RecordedAt,
                ExecutionStarted = h.ExecutionStarted,
                ExecutionCompleted = h.ExecutionCompleted,
                ElapsedMilliseconds = h.ElapsedMilliseconds
            })
            .ToListAsync();

        return history;
    }
}

public class PaginatedBuilds
{
    public required ICollection<Build> Items { get; set; }
    public int TotalCount { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}
