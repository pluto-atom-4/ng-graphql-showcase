using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.GraphQL.DataLoaders;

[DataLoader("GetPartsByBuildId")]
public async Task<IReadOnlyDictionary<Guid, List<Part>>> GetPartsByBuildId(
    IReadOnlyList<Guid> buildIds,
    [Service] FactoryDbContext context,
    CancellationToken ct)
    => await context.Parts
        .Where(p => buildIds.Contains(p.BuildId))
        .AsNoTracking()
        .GroupBy(p => p.BuildId)
        .ToDictionaryAsync(g => g.Key, g => g.ToList(), ct);
