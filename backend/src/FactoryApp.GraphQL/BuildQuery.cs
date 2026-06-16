using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using HotChocolate.Execution.Configuration;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.GraphQL;

[GraphQLType("Query")]
public class BuildQueryType
{
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Build> GetBuilds([Service] FactoryDbContext context)
        => context.Builds.AsNoTracking();

    public async Task<Build?> GetBuild(
        Guid id,
        [Service] FactoryDbContext context)
        => await context.Builds
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id);

    public async Task<PaginatedBuilds> GetBuildsPaginated(
        int limit,
        int offset,
        [Service] FactoryDbContext context)
    {
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
}

public class PaginatedBuilds
{
    public required ICollection<Build> Items { get; set; }
    public int TotalCount { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}
