using FactoryApp.GraphQL.Services;
using Microsoft.Extensions.Logging;

namespace FactoryApp.Tests.Mocks;

/// <summary>
/// Mock LoggingService that suppresses console output during tests.
/// </summary>
public class MockLoggingService : LoggingService
{
    private static readonly ILogger<LoggingService> MockLogger = new NullLogger<LoggingService>();

    public MockLoggingService() : base(MockLogger)
    {
    }
}

/// <summary>
/// No-op logger implementation for tests.
/// </summary>
internal class NullLogger<T> : ILogger<T>
{
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel logLevel) => false;
    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) { }
}
