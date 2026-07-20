using HotChocolate.Subscriptions;

var builder = WebApplication.CreateBuilder(args);
builder.Environment.EnvironmentName = "Development";

builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>()
    .AddSubscriptionType<Subscription>()
    .AddInMemorySubscriptions();

var app = builder.Build();

app.MapGraphQL("/graphql");

Console.WriteLine("✓ Subscription POC running - schema should include OnMessageReceived");

app.Run();

public class Query
{
    public string Hello => "world";
}

public class Subscription
{
    [Subscribe]
    public async IAsyncEnumerable<MessageReceived> OnMessageReceived(
        [EventMessage] string message)
    {
        yield return new MessageReceived { Topic = "test", Message = message, Timestamp = DateTime.UtcNow };
    }
}

public class MessageReceived
{
    public string Topic { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
