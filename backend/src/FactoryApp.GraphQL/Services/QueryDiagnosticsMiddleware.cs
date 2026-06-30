using System.Diagnostics;
using Microsoft.AspNetCore.Http;

namespace FactoryApp.GraphQL.Services;

/// <summary>
/// Service to track query count per GraphQL request via EF Core diagnostic events.
/// Stores diagnostics in IRequestContext.ContextData for injection into response extensions.
/// </summary>
public class QueryDiagnosticsService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private const string DiagnosticsKey = "graphql_diagnostics";

    public QueryDiagnosticsService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Initialize diagnostics for new GraphQL request.
    /// </summary>
    public void InitializeRequest()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext != null)
        {
            httpContext.Items[DiagnosticsKey] = new GraphQLDiagnostics
            {
                StartedAt = DateTime.UtcNow,
                QueryCount = 0
            };
        }
    }

    /// <summary>
    /// Increment query count (called from DatabaseQueryListener).
    /// </summary>
    public void IncrementQueryCount()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.Items.TryGetValue(DiagnosticsKey, out var diagnosticsObj) == true)
        {
            if (diagnosticsObj is GraphQLDiagnostics diagnostics)
            {
                Interlocked.Increment(ref diagnostics.QueryCount);
            }
        }
    }

    /// <summary>
    /// Get diagnostics for response (called after request completes).
    /// </summary>
    public GraphQLDiagnostics? GetDiagnostics()
    {
        var httpContext = _httpContextAccessor.HttpContext;
        if (httpContext?.Items.TryGetValue(DiagnosticsKey, out var diagnosticsObj) == true)
        {
            return diagnosticsObj as GraphQLDiagnostics;
        }
        return null;
    }
}

/// <summary>
/// Tracks query execution diagnostics per GraphQL request.
/// Note: QueryCount is a field (not property) to support Interlocked operations.
/// </summary>
public class GraphQLDiagnostics
{
    public DateTime StartedAt { get; set; }
    public int QueryCount;
}
