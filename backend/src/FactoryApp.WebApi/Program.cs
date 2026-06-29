using FactoryApp.Domain;
using FactoryApp.Domain.TestFixtures;
using FactoryApp.GraphQL;
using FactoryApp.GraphQL.DataLoaders;
using FactoryApp.GraphQL.Services;
using FactoryApp.GraphQL.Types;
using FactoryApp.Workflows.Activities;
using Elsa;
using Microsoft.EntityFrameworkCore;

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

// 2. Register application services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<LoggingService>();
builder.Services.AddScoped<BuildDataLoaders>();

// 2.5 Register Elsa Workflows (Phase 2 infrastructure)
// TODO: Wire up Elsa v3 workflow registration when finalizing integration
// Activities: PublishBuildStatusActivity, GetBuildActivity ready for workflow use

// 3. Register Hot Chocolate GraphQL Server with domain resolvers
builder.Services
    .AddGraphQLServer()
    .AddQueryType<BuildQueryType>()
    .AddMutationType<BuildMutationType>()
    .AddSubscriptionType<BuildSubscription>()
    .AddObjectType<BuildType>()
    .AddInMemorySubscriptions();

var app = builder.Build();

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

