using System.Text.Json;
using FactoryApp.WebApi.GraphQL;
using HotChocolate.Language;

namespace FactoryApp.WebApi.Middleware;

public class QueryComplexityCheckMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<QueryComplexityCheckMiddleware> _logger;

    public QueryComplexityCheckMiddleware(RequestDelegate next, ILogger<QueryComplexityCheckMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, QueryComplexityValidator validator)
    {
        if (!context.Request.Path.StartsWithSegments("/graphql"))
        {
            await _next(context);
            return;
        }

        if (context.Request.ContentType?.Contains("application/json") != true)
        {
            await _next(context);
            return;
        }

        context.Request.EnableBuffering();
        var body = await new StreamReader(context.Request.Body).ReadToEndAsync();
        context.Request.Body.Position = 0;

        try
        {
            var request = JsonSerializer.Deserialize<GraphQLRequest>(body);
            if (!string.IsNullOrEmpty(request?.Query))
            {
                var document = Utf8GraphQLParser.Parse(request.Query);
                var (isValid, complexity, errorMessage) = validator.ValidateQuery(document);

                if (!isValid)
                {
                    _logger.LogWarning("Query complexity {Complexity} exceeds limit", complexity);
                    context.Response.ContentType = "application/json";
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await context.Response.WriteAsJsonAsync(new
                    {
                        errors = new[] { new { message = errorMessage } }
                    });
                    return;
                }
            }
        }
        catch (SyntaxException ex)
        {
            _logger.LogDebug("Invalid GraphQL query: {Message}", ex.Message);
        }

        await _next(context);
    }
}

public class GraphQLRequest
{
    public string? Query { get; set; }
    public string? OperationName { get; set; }
    public Dictionary<string, object?>? Variables { get; set; }
}
