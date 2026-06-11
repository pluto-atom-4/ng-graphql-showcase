var builder = WebApplication.CreateBuilder(args);

// 1. Register Hot Chocolate GraphQL Server with base root types
builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>()
    .AddMutationType<Mutation>()
    .AddSubscriptionType<Subscription>();

var app = builder.Build();

// 2. Map the GraphQL endpoint (Defaults to /graphql)
app.MapGraphQL();

app.Run();

// 3. Define minimalist inline types for the engine bootstrap process
public class Query
{
    public string Init() => "GraphQL Engine Online";
}

public class Mutation
{
    public string Init() => "Mutations Ready";
}

public class Subscription
{
    public string Init() => "Subscriptions Ready";
}

