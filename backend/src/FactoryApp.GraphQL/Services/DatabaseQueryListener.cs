using System.Diagnostics;

namespace FactoryApp.GraphQL.Services;

/// <summary>
/// Listens to EF Core command execution events and increments query count.
/// Registered globally to capture all database queries across requests.
/// </summary>
public class DatabaseQueryListener : IObserver<KeyValuePair<string, object?>>
{
    private readonly QueryDiagnosticsService _diagnosticsService;

    public DatabaseQueryListener(QueryDiagnosticsService diagnosticsService)
    {
        _diagnosticsService = diagnosticsService;
    }

    /// <summary>
    /// Called when EF Core diagnostic event is emitted.
    /// Increments query count on "CommandExecuting" events.
    /// </summary>
    public void OnNext(KeyValuePair<string, object?> value)
    {
        // Only count actual database commands
        if (value.Key == "Microsoft.EntityFrameworkCore.Database.Command.CommandExecuting")
        {
            _diagnosticsService.IncrementQueryCount();
        }
    }

    public void OnError(Exception error)
    {
        // Silently ignore diagnostic errors
    }

    public void OnCompleted()
    {
        // No-op
    }
}

/// <summary>
/// Observer that subscribes to EF Core diagnostic events.
/// Instantiated once per application.
/// </summary>
public class EFCoreDiagnosticObserver : IObserver<DiagnosticListener>
{
    private readonly DatabaseQueryListener _listener;

    public EFCoreDiagnosticObserver(DatabaseQueryListener listener)
    {
        _listener = listener;
    }

    public void OnNext(DiagnosticListener value)
    {
        // Subscribe to Entity Framework Core diagnostic source
        if (value.Name == "Microsoft.EntityFrameworkCore")
        {
            value.Subscribe(_listener);
        }
    }

    public void OnError(Exception error)
    {
        // Silently ignore errors
    }

    public void OnCompleted()
    {
        // No-op
    }
}
