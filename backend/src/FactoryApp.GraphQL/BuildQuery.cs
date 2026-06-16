using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.Services;
using HotChocolate;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.GraphQL;

public class BuildQueryType
{
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
}

public class PaginatedBuilds
{
    public required ICollection<Build> Items { get; set; }
    public int TotalCount { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}
