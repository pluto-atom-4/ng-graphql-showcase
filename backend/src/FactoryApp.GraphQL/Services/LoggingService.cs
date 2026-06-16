using Microsoft.Extensions.Logging;

namespace FactoryApp.GraphQL.Services;

public class LoggingService
{
    private readonly ILogger<LoggingService> _logger;

    public LoggingService(ILogger<LoggingService> logger)
    {
        _logger = logger;
    }

    public void LogMutationStart(string mutationName, Dictionary<string, object?> args)
    {
        var argString = string.Join(", ", args.Select(kvp => $"{kvp.Key}={kvp.Value}"));
        _logger.LogInformation("Mutation started: {MutationName} with args: {Args}", mutationName, argString);
    }

    public void LogMutationSuccess(string mutationName, Guid? entityId = null)
    {
        _logger.LogInformation("Mutation succeeded: {MutationName}{EntityId}",
            mutationName,
            entityId.HasValue ? $" (ID: {entityId})" : "");
    }

    public void LogMutationError(string mutationName, Exception ex, Dictionary<string, object?> args)
    {
        var argString = string.Join(", ", args.Select(kvp => $"{kvp.Key}={kvp.Value}"));
        _logger.LogError(ex, "Mutation failed: {MutationName} with args: {Args}", mutationName, argString);
    }

    public void LogQueryStart(string queryName, Dictionary<string, object?> args)
    {
        var argString = string.Join(", ", args.Select(kvp => $"{kvp.Key}={kvp.Value}"));
        _logger.LogDebug("Query started: {QueryName} with args: {Args}", queryName, argString);
    }

    public void LogQueryError(string queryName, Exception ex)
    {
        _logger.LogError(ex, "Query failed: {QueryName}", queryName);
    }

    public void LogValidationError(string operation, string message)
    {
        _logger.LogWarning("Validation error in {Operation}: {Message}", operation, message);
    }

    public void LogDatabaseError(string operation, Exception ex)
    {
        _logger.LogError(ex, "Database error in {Operation}", operation);
    }

    public void LogAuthenticationAttempt(string email, bool success)
    {
        if (success)
            _logger.LogInformation("Authentication succeeded for user: {Email}", email);
        else
            _logger.LogWarning("Authentication failed for user: {Email}", email);
    }
}
