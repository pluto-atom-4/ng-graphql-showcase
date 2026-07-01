using Microsoft.Extensions.DependencyInjection;

namespace FactoryApp.WebApi.GraphQL;

public static class GraphQLServiceCollectionExtensions
{
    public static IServiceCollection AddQueryComplexityValidator(
        this IServiceCollection services)
    {
        services.AddScoped<QueryComplexityValidator>();
        return services;
    }
}
