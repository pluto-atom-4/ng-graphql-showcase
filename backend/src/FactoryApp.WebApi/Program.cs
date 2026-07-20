using System.Diagnostics;
using FactoryApp.Domain;
using FactoryApp.Domain.TestFixtures;
using FactoryApp.GraphQL;
using FactoryApp.GraphQL.DataLoaders;
using FactoryApp.GraphQL.Services;
using FactoryApp.GraphQL.Types;
using FactoryApp.Workflows.Services;
using FactoryApp.Workflows.Activities;
using FactoryApp.WebApi.GraphQL;
using FactoryApp.WebApi.Middleware;
using Elsa.Extensions;
using Elsa.Persistence.Dapper.Extensions;
using Elsa.Persistence.Dapper.Services;
using FluentMigrator.Runner;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// 1. Register Entity Framework Core with SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Allow password override via environment variable (for Docker/CI)
if (!string.IsNullOrEmpty(connectionString) && !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("MSSQL_SA_PASSWORD")))
{
    var saPassword = Environment.GetEnvironmentVariable("MSSQL_SA_PASSWORD");
    connectionString = System.Text.RegularExpressions.Regex.Replace(
        connectionString,
        @"Password=[^;]+",
        $"Password={saPassword}");
}

connectionString ??= "Server=(localdb)\\mssqllocaldb;Database=FactoryAppDb;Trusted_Connection=true;";

builder.Services.AddDbContext<FactoryDbContext>(options =>
    options.UseSqlServer(connectionString));

// 2. Register JWT Bearer Authentication (issue #133)
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Missing JWT_SECRET environment variable or Jwt:Secret config");

var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSecret));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "factory-app",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "factory-app-users",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy =>
        policy.RequireRole("Admin"));

    options.AddPolicy("RequireUser", policy =>
        policy.RequireRole("User", "Admin"));

    options.AddPolicy("CanEditBuild", policy =>
        policy.RequireClaim("edit_builds", "true"));

    options.AddPolicy("CanDeleteBuild", policy =>
        policy.RequireClaim("delete_builds", "true"));

    options.AddPolicy("CanViewTestResults", policy =>
        policy.RequireRole("Admin")
            .RequireClaim("view_tests", "true"));
});

// 2.1 Register CORS policy (issue #219)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:4200",      // Angular dev server
                "http://localhost:3000")      // Alternative dev port
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();  // Required for JWT auth
    });
});

// 2.2 Register application services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<LoggingService>();
builder.Services.AddScoped<BuildDataLoaders>();
builder.Services.AddSingleton<SubscriptionRateLimiter>();
builder.Services.AddHttpContextAccessor();

// 2.2b Rate Limiting (issue #147) - Redis + sliding window
var rateLimitOptions = new RateLimitOptions();
builder.Configuration.GetSection("RateLimiting").Bind(rateLimitOptions);
builder.Services.AddSingleton(rateLimitOptions);

var redisConnectionString = builder.Configuration["Redis:ConnectionString"] ?? "localhost:6379";
var redisAvailable = false;
try
{
    var redis = ConnectionMultiplexer.Connect(redisConnectionString);
    builder.Services.AddSingleton<IConnectionMultiplexer>(redis);
    redisAvailable = true;
}
catch (Exception ex)
{
    // Log warning but allow startup if Redis is unavailable
    Console.WriteLine($"Warning: Could not connect to Redis at {redisConnectionString}: {ex.Message}");
    Console.WriteLine("Rate limiting will be disabled. Redis is required for production.");
}

// 2.2a Phase 6 - Workflow Recovery & History
builder.Services.AddScoped<IWorkflowHistoryStore, WorkflowHistoryStore>();
builder.Services.AddHostedService<WorkflowRecoveryService>();
builder.Services.AddHostedService<WorkflowCleanupService>();

// 2.4 Query Complexity Limits (issue #146)
builder.Services.Configure<QueryComplexityOptions>(builder.Configuration.GetSection("GraphQL:QueryComplexity"));
builder.Services.AddScoped<FieldCostCalculator>(sp =>
    new FieldCostCalculator(sp.GetRequiredService<IOptions<QueryComplexityOptions>>().Value));
builder.Services.AddQueryComplexityValidator();

// 2.3 Query diagnostics (for N+1 detection in HTTP tests)
builder.Services.AddSingleton<QueryDiagnosticsService>();
builder.Services.AddSingleton<DatabaseQueryListener>();
builder.Services.AddSingleton<IObserver<DiagnosticListener>>(sp =>
    new EFCoreDiagnosticObserver(sp.GetRequiredService<DatabaseQueryListener>()));

// 2.5 Elsa Workflows v3.5.3 (Phase 5d - Dapper SQL Server Persistence)
// Configure FluentMigrator for Elsa Dapper schema initialization
builder.Services
    .AddFluentMigratorCore()
    .ConfigureRunner(runner => runner
        .AddSqlServer()
        .WithGlobalConnectionString(connectionString)
        .ScanIn(System.Reflection.Assembly.Load("Elsa.Persistence.Dapper.Migrations")).For.Migrations());

builder.Services.AddElsa(elsa =>
{
    elsa.UseDapper(dapper =>
    {
        dapper.DbConnectionProvider = _ => new SqlServerDbConnectionProvider(connectionString);
        dapper.UseMigrations();
    });

    elsa.UseWorkflowManagement(management => management.UseDapper());
    elsa.UseWorkflowRuntime(runtime => runtime.UseDapper());

    elsa.AddActivitiesFrom<Program>();
    elsa.AddWorkflowsFrom<Program>();
});

// Register activities as scoped services for DI injection in activity constructors
builder.Services.AddScoped<GetBuildActivity>();
builder.Services.AddScoped<PublishBuildStatusActivity>();
builder.Services.AddScoped<ProcessPartsActivity>();
builder.Services.AddScoped<TriggerTestRunActivity>();
builder.Services.AddScoped<AwaitTestCompletionActivity>();

// 3. Register Hot Chocolate GraphQL Server with domain resolvers
// Note: Authorization policies registered above are available to resolvers via ClaimsPrincipal
builder.Services
    .AddGraphQLServer()
    .AddQueryType<BuildQueryType>()
    .AddMutationType<BuildMutationType>()
    .AddSubscriptionType<BuildSubscription>()
    .AddObjectType<BuildType>()
    .AddType<WorkflowHistoryType>()
    .AddInMemorySubscriptions();
// Note: RateLimitDirective scaffolded in FactoryApp.GraphQL.Directives but NOT registered.
// Reason: Hot Chocolate v15 directive middleware runs after resolver execution, unsuitable
// for rate-limit enforcement. HTTP middleware (RateLimitMiddleware) covers all use cases.
// See RateLimitDirective.cs for future enhancement plan (Phase 5).

var app = builder.Build();

// 3.5 Subscribe to EF Core diagnostics for query counting
DiagnosticListener.AllListeners.Subscribe(
    app.Services.GetRequiredService<IObserver<DiagnosticListener>>());

// 3.6 Add middleware to initialize query diagnostics per request
app.Use(async (context, next) =>
{
    var diagnosticsService = context.RequestServices.GetRequiredService<QueryDiagnosticsService>();
    diagnosticsService.InitializeRequest();
    await next();
});

// 3.7 Add middleware to inject diagnostics into GraphQL response extensions
// DISABLED: Stream disposal issue. QueryCount tracking still functional via DatabaseQueryListener.
// app.UseGraphQLDiagnostics();

// 3.7b Add CORS middleware (issue #219) - MUST be before MapGraphQL
app.UseCors("AllowFrontend");

// 3.7c Enable WebSocket support for GraphQL subscriptions
app.UseWebSockets();

// 3.8 Add authentication & authorization middleware (issue #133)
app.UseAuthentication();
app.UseAuthorization();

// 3.8b Add rate limiting middleware (issue #147)
if (redisAvailable)
{
    app.UseMiddleware<RateLimitMiddleware>();
}
else
{
    Console.WriteLine("⚠️  Rate limiting middleware disabled: Redis unavailable");
}

// 3.9 Add query complexity check middleware (issue #146)
app.UseMiddleware<QueryComplexityCheckMiddleware>();

// 3.11 Run migrations on startup (EF Core first, then Elsa FluentMigrator)
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<FactoryDbContext>();
    var runner = scope.ServiceProvider.GetRequiredService<IMigrationRunner>();

    // 3.11a Apply EF Core migrations first (owns: Builds, Parts, TestRuns, WorkflowHistory, AuthUsers, etc.)
    try
    {
        await dbContext.Database.MigrateAsync();
        Console.WriteLine("✓ EF Core migrations applied successfully");
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"⚠️  EF Core migration error: {ex.Message}");
        Console.Error.WriteLine("⚠️  Continuing with application startup. Core schema may be incomplete.");
    }

    // 3.11b Clean up duplicate columns before running Elsa migrations (fixes V3_7 idempotency issue #196)
    try
    {
        await dbContext.Database.ExecuteSqlAsync($@"
            -- Check if AggregateFaultCount exists and remove duplicates
            IF EXISTS (
                SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = 'dbo'
                AND TABLE_NAME = 'ActivityExecutionRecords'
                AND COLUMN_NAME = 'AggregateFaultCount'
            )
            BEGIN
                -- Column exists, drop it to allow clean re-creation
                IF OBJECT_ID('DF_ActivityExecutionRecords_AggregateFaultCount', 'D') IS NOT NULL
                    ALTER TABLE [dbo].[ActivityExecutionRecords]
                    DROP CONSTRAINT [DF_ActivityExecutionRecords_AggregateFaultCount];

                ALTER TABLE [dbo].[ActivityExecutionRecords]
                DROP COLUMN [AggregateFaultCount];
            END
        ");
    }
    catch
    {
        // Silently ignore if operation fails (column may not exist or constraints are different)
    }

    // 3.11c Run Elsa FluentMigrator migrations (owns: ActivityExecutionRecords, WorkflowDefinitions, etc.)
    try
    {
        runner.MigrateUp();
        Console.WriteLine("✓ Elsa migrations applied successfully");
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"⚠️  Elsa migration error (non-fatal): {ex.Message}");
        Console.Error.WriteLine("⚠️  Continuing with application startup. Elsa schema may be incomplete.");
    }
}

// 4. Seed test data in development or when TEST_SEED_DATA is set
if (app.Environment.IsDevelopment() || Environment.GetEnvironmentVariable("TEST_SEED_DATA") == "true")
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<FactoryDbContext>();
        FixtureSeeder.SeedAllAsync(dbContext).Wait();
    }
}

// 5. Map the GraphQL endpoint (Defaults to /graphql)
app.MapGraphQL();

app.Run();

