using FactoryApp.Domain;
using FactoryApp.GraphQL;
using FactoryApp.GraphQL.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Register Entity Framework Core with SQL Server
builder.Services.AddDbContext<FactoryDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
            ?? "Server=(localdb)\\mssqllocaldb;Database=FactoryAppDb;Trusted_Connection=true;"));

// 2. Register application services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<LoggingService>();

// 3. Register Hot Chocolate GraphQL Server with domain resolvers
builder.Services
    .AddGraphQLServer()
    .AddQueryType<BuildQueryType>()
    .AddMutationType<BuildMutationType>()
    .AddSubscriptionType<BuildSubscription>()
    .AddInMemorySubscriptions();

var app = builder.Build();

// 4. Map the GraphQL endpoint (Defaults to /graphql)
app.MapGraphQL();

app.Run();

