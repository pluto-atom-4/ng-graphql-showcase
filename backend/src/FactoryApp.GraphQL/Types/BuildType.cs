using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using HotChocolate;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.GraphQL.Types;

public class BuildPayload
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public async Task<List<Part>> GetParts(
        [Service] FactoryDbContext context,
        CancellationToken ct)
    {
        return await context.Parts
            .Where(p => p.BuildId == Id)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<List<TestRun>> GetTestRuns(
        [Service] FactoryDbContext context,
        CancellationToken ct)
    {
        return await context.TestRuns
            .Where(t => t.BuildId == Id)
            .AsNoTracking()
            .ToListAsync(ct);
    }
}
