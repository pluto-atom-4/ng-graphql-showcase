using FactoryApp.Domain;
using FactoryApp.GraphQL;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Register Entity Framework Core with SQL Server
builder.Services.AddDbContext<FactoryDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
            ?? "Server=(localdb)\\mssqllocaldb;Database=FactoryAppDb;Trusted_Connection=true;"));

// 2. Register Hot Chocolate GraphQL Server with domain resolvers
builder.Services
    .AddGraphQLServer()
    .AddQueryType<BuildQuery>()
    .AddMutationType<BuildMutation>()
    .AddSubscriptionType<BuildSubscription>()
    .AddInMemorySubscriptions()
    .ModifyRequestOptions(opt => opt.IncludeExceptionDetails = true);

var app = builder.Build();

// 3. Map the GraphQL endpoint (Defaults to /graphql)
app.MapGraphQL();

app.Run();

