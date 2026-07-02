using System.Security.Claims;
using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.DataLoaders;
using HotChocolate;
using Microsoft.AspNetCore.Http;

namespace FactoryApp.GraphQL.Types;

public class BuildType
{
    /// <summary>
    /// Phase 4: Authorization-aware nested field.
    /// Uses GetPartsByBuildIdAuthorized to pre-filter parts based on user role/claims.
    /// Prevents N+1 authorization checks (all builds' parts checked in single batch).
    /// </summary>
    public async Task<ICollection<Part>> GetParts(
        [Parent] Build build,
        [Service] BuildDataLoaders dataLoaders,
        [Service] IHttpContextAccessor httpContextAccessor,
        CancellationToken ct)
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (user == null)
            return new List<Part>();

        var parts = await dataLoaders.GetPartsByBuildIdAuthorized(new[] { build.Id }, user, ct);
        return parts.TryGetValue(build.Id, out var buildParts) ? buildParts : new List<Part>();
    }

    /// <summary>
    /// Phase 4: Authorization-aware nested field.
    /// Uses GetTestRunsByBuildIdAuthorized with claim-based filtering.
    /// Admin + view_tests claim: all test runs. Others: filtered (Phase 4B).
    /// </summary>
    public async Task<ICollection<TestRun>> GetTestRuns(
        [Parent] Build build,
        [Service] BuildDataLoaders dataLoaders,
        [Service] IHttpContextAccessor httpContextAccessor,
        CancellationToken ct)
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (user == null)
            return new List<TestRun>();

        var testRuns = await dataLoaders.GetTestRunsByBuildIdAuthorized(new[] { build.Id }, user, ct);
        return testRuns.TryGetValue(build.Id, out var buildTestRuns) ? buildTestRuns : new List<TestRun>();
    }
}

public class BuildPayload
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public async Task<List<Part>> GetParts(
        [Service] BuildDataLoaders dataLoaders,
        [Service] IHttpContextAccessor httpContextAccessor,
        CancellationToken ct)
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (user == null)
            return new List<Part>();

        var parts = await dataLoaders.GetPartsByBuildIdAuthorized(new[] { Id }, user, ct);
        return parts.TryGetValue(Id, out var buildParts) ? buildParts : new List<Part>();
    }

    public async Task<List<TestRun>> GetTestRuns(
        [Service] BuildDataLoaders dataLoaders,
        [Service] IHttpContextAccessor httpContextAccessor,
        CancellationToken ct)
    {
        var user = httpContextAccessor.HttpContext?.User;
        if (user == null)
            return new List<TestRun>();

        var testRuns = await dataLoaders.GetTestRunsByBuildIdAuthorized(new[] { Id }, user, ct);
        return testRuns.TryGetValue(Id, out var buildTestRuns) ? buildTestRuns : new List<TestRun>();
    }
}
