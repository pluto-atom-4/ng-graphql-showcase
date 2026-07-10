using FactoryApp.Domain;
using FactoryApp.Domain.TestFixtures;
using FactoryApp.Workflows.Activities;
using Elsa.Extensions;
using Elsa.Workflows.Runtime;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FactoryApp.Tests.Workflows;

/// <summary>
/// Shared test fixture for workflow integration tests.
/// Provides DbContext, Elsa workflow runtime, and service provider.
/// </summary>
public class WorkflowTestFixture : IAsyncLifetime
{
    private readonly IServiceProvider _serviceProvider;
    private readonly string _testDbName;
    private IServiceScope _scope = null!;
    private FactoryDbContext _dbContext = null!;
    private IWorkflowRuntime _workflowRuntime = null!;
    private ILogger<WorkflowTestFixture> _logger = null!;

    public FactoryDbContext DbContext => _dbContext;
    public IWorkflowRuntime WorkflowRuntime => _workflowRuntime;
    public IServiceProvider ServiceProvider => _serviceProvider;
    public ILogger<WorkflowTestFixture> Logger => _logger;

    public WorkflowTestFixture()
    {
        // Use unique test database per test run for complete isolation
        _testDbName = $"FactoryAppDb_Test_{Guid.NewGuid():N}";

        // Build DI container with Elsa + EF Core
        var services = new ServiceCollection();

        var connectionString = TestConstants.TestConnectionString.Replace(
            "Database=FactoryAppDb_Test",
            $"Database={_testDbName}");

        services.AddDbContext<FactoryDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddLogging(config =>
            config.AddConsole().SetMinimumLevel(LogLevel.Information));

        services.AddElsa(elsa =>
        {
            // Register workflows from actual workflow assembly
            elsa.AddActivitiesFrom<FactoryApp.Workflows.Activities.GetBuildActivity>();
            elsa.AddWorkflowsFrom<FactoryApp.Workflows.WorkflowDefinitions.BuildProcessWorkflow>();
        });

        services.AddScoped<GetBuildActivity>();
        services.AddScoped<ProcessPartsActivity>();
        services.AddScoped<TriggerTestRunActivity>();
        services.AddScoped<AwaitTestCompletionActivity>();
        services.AddScoped<PublishBuildStatusActivity>();

        _serviceProvider = services.BuildServiceProvider();
    }

    public async Task InitializeAsync()
    {
        // Create scope that lives for the entire test
        _scope = _serviceProvider.CreateScope();

        _dbContext = _scope.ServiceProvider.GetRequiredService<FactoryDbContext>();
        _workflowRuntime = _scope.ServiceProvider.GetRequiredService<IWorkflowRuntime>();
        _logger = _scope.ServiceProvider.GetRequiredService<ILogger<WorkflowTestFixture>>();

        // Ensure clean test database
        await _dbContext.Database.EnsureDeletedAsync();

        // Run migrations to create schema
        await _dbContext.Database.MigrateAsync();

        _logger.LogInformation("Test database initialized");
    }

    public async Task DisposeAsync()
    {
        try
        {
            // Clean up test database
            if (_dbContext != null)
            {
                await _dbContext.Database.EnsureDeletedAsync();
                _dbContext.Dispose();
            }

            // Dispose scope
            _scope?.Dispose();
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Error during fixture cleanup");
        }
    }
}
