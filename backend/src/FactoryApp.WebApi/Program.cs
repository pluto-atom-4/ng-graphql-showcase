using System.Diagnostics;
using FactoryApp.Domain;
using FactoryApp.Domain.TestFixtures;
using FactoryApp.GraphQL;
using FactoryApp.GraphQL.DataLoaders;
using FactoryApp.GraphQL.Services;
using FactoryApp.GraphQL.Types;
using FactoryApp.Workflows.Activities;
using FactoryApp.WebApi.GraphQL;
using FactoryApp.WebApi.Middleware;
using Elsa;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

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

builder.Services.AddAuthorization();

// 2.2 Register application services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<LoggingService>();
builder.Services.AddScoped<BuildDataLoaders>();
builder.Services.AddSingleton<SubscriptionRateLimiter>();
builder.Services.AddHttpContextAccessor();

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

// 2.5 Elsa Workflows v3 (Phase 5B - Deferred)
// ROADBLOCK: Elsa v3.5.3 ActivityExecutionContext lacks SetVariable/GetVariable API
// Activities stubbed with documented limitations pending Elsa v3.6+ upgrade
// See: GetBuildActivity.cs, PublishBuildStatusActivity.cs for implementation notes
// Phase 5C: Upgrade Elsa + implement workflow context variable binding

// 3. Register Hot Chocolate GraphQL Server with domain resolvers
builder.Services
    .AddGraphQLServer()
    .AddQueryType<BuildQueryType>()
    .AddMutationType<BuildMutationType>()
    .AddSubscriptionType<BuildSubscription>()
    .AddObjectType<BuildType>()
    .AddInMemorySubscriptions();

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

// 3.8 Add authentication & authorization middleware (issue #133)
app.UseAuthentication();
app.UseAuthorization();

// 3.9 Add query complexity check middleware (issue #146)
app.UseMiddleware<QueryComplexityCheckMiddleware>();

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

