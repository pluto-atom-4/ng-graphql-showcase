using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.GraphQL.DataLoaders;

public class BuildDataLoaders
{
    private readonly FactoryDbContext _context;

    public BuildDataLoaders(FactoryDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyDictionary<Guid, List<Part>>> GetPartsByBuildId(
        IReadOnlyList<Guid> buildIds,
        FactoryDbContext? _ = null,
        CancellationToken ct = default)
        => await _context.Parts
            .Where(p => buildIds.Contains(p.BuildId))
            .AsNoTracking()
            .GroupBy(p => p.BuildId)
            .ToDictionaryAsync(g => g.Key, g => g.ToList(), ct);

    public async Task<IReadOnlyDictionary<Guid, List<TestRun>>> GetTestRunsByBuildId(
        IReadOnlyList<Guid> buildIds,
        FactoryDbContext? _ = null,
        CancellationToken ct = default)
        => await _context.TestRuns
            .Where(t => buildIds.Contains(t.BuildId))
            .AsNoTracking()
            .GroupBy(t => t.BuildId)
            .ToDictionaryAsync(g => g.Key, g => g.ToList(), ct);
}
