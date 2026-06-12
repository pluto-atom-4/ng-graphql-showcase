using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.GraphQL;

public class BuildQuery
{
    public async Task<Build?> GetBuild(Guid id, FactoryDbContext dbContext)
    {
        return await dbContext.Builds.FindAsync(id);
    }

    public async Task<PaginatedBuilds> GetBuilds(int limit, int offset, FactoryDbContext dbContext)
    {
        var query = dbContext.Builds.AsQueryable();
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
