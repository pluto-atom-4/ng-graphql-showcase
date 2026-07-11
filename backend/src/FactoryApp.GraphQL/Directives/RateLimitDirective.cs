using HotChocolate;

namespace FactoryApp.GraphQL.Directives;

[GraphQLName("rateLimit")]
public class RateLimitDirective
{
    public int RequestsPerMinute { get; set; } = 200;
}

