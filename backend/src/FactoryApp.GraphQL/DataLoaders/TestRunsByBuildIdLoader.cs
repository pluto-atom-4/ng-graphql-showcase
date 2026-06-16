using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using HotChocolate;
using HotChocolate.Execution;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.GraphQL.DataLoaders;

[DataLoader("GetTestRunsByBuildId")]
public async Task<IReadOnlyDictionary<Guid, List<TestRun>>> GetTestRunsByBuildId(
    IReadOnlyList<Guid> buildIds,
    [Service] FactoryDbContext context,
    CancellationToken ct)
    => await context.TestRuns
        .Where(t => buildIds.Contains(t.BuildId))
        .AsNoTracking()
        .GroupBy(t => t.BuildId)
        .ToDictionaryAsync(g => g.Key, g => g.ToList(), ct);
