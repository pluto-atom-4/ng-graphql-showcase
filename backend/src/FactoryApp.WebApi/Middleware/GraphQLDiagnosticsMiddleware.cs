using System.Text;
using System.Text.Json;
using FactoryApp.GraphQL.Services;

namespace FactoryApp.WebApi.Middleware;

/// <summary>
/// Middleware to inject query diagnostics into GraphQL response extensions.
/// Must run after MapGraphQL but intercepts the response to add queryCount and responseTimeMs.
/// </summary>
public class GraphQLDiagnosticsMiddleware
{
    private readonly RequestDelegate _next;

    public GraphQLDiagnosticsMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, QueryDiagnosticsService diagnosticsService)
    {
        // Only process GraphQL requests
        if (!context.Request.Path.Value?.EndsWith("/graphql") == true)
        {
            await _next(context);
            return;
        }

        // Save original response body stream
        var originalBodyStream = context.Response.Body;
        using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        // Call next middleware (GraphQL execution)
        await _next(context);

        // Get diagnostics before response is sent
        var diagnostics = diagnosticsService.GetDiagnostics();

        // Only inject if response is JSON content-type
        if (context.Response.ContentType?.Contains("json") == true && diagnostics != null)
        {
            try
            {
                // Read response body
                responseBody.Seek(0, SeekOrigin.Begin);
                using var reader = new StreamReader(responseBody, Encoding.UTF8);
                var responseContent = await reader.ReadToEndAsync();

                // Parse JSON
                using var jsonDoc = JsonDocument.Parse(responseContent);
                var jsonObject = jsonDoc.RootElement.Clone();

                // Inject diagnostics into extensions
                var modifiedJson = InjectDiagnostics(jsonObject, diagnostics);

                // Write modified response
                responseBody.Seek(0, SeekOrigin.Begin);
                responseBody.SetLength(0);

                using (var writer = new StreamWriter(responseBody, Encoding.UTF8, leaveOpen: true))
                {
                    await writer.WriteAsync(modifiedJson.GetRawText());
                    await writer.FlushAsync();
                }
            }
            catch
            {
                // If injection fails, just pass through original response
            }
        }

        // Copy to original stream
        responseBody.Seek(0, SeekOrigin.Begin);
        await responseBody.CopyToAsync(originalBodyStream);
    }

    private static JsonElement InjectDiagnostics(JsonElement root, GraphQLDiagnostics diagnostics)
    {
        var options = new JsonSerializerOptions { WriteIndented = false };
        var dict = new Dictionary<string, object>();

        // Copy existing properties
        foreach (var property in root.EnumerateObject())
        {
            dict[property.Name] = property.Value.Clone();
        }

        // Ensure extensions object exists
        if (!dict.TryGetValue("extensions", out var extensionsObj) ||
            extensionsObj is not JsonElement extensionsElement)
        {
            dict["extensions"] = new Dictionary<string, object>();
        }
        else
        {
            var extDict = new Dictionary<string, object>();
            foreach (var prop in extensionsElement.EnumerateObject())
            {
                extDict[prop.Name] = prop.Value.Clone();
            }
            dict["extensions"] = extDict;
        }

        // Add diagnostics
        if (dict["extensions"] is Dictionary<string, object> extensions)
        {
            extensions["queryCount"] = diagnostics.QueryCount;
            extensions["responseTimeMs"] = Math.Round((DateTime.UtcNow - diagnostics.StartedAt).TotalMilliseconds, 2);
        }

        // Serialize back to JSON
        var json = JsonSerializer.Serialize(dict, options);
        return JsonDocument.Parse(json).RootElement;
    }
}

public static class GraphQLDiagnosticsMiddlewareExtensions
{
    public static IApplicationBuilder UseGraphQLDiagnostics(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GraphQLDiagnosticsMiddleware>();
    }
}
