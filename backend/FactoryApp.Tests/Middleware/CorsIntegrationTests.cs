using System.Net;
using FactoryApp.Tests.Fixtures;
using Xunit;

namespace FactoryApp.Tests.Middleware;

/// <summary>
/// Integration tests for CORS middleware (issue #219).
/// Verifies frontend (localhost:4200) can communicate with GraphQL backend.
/// </summary>
[Collection("SQL Server")]
public class CorsIntegrationTests : IAsyncLifetime
{
    private readonly TestDatabaseFixture _fixture = new();
    private HttpClient _client = null!;

    public async Task InitializeAsync()
    {
        await _fixture.InitializeAsync();
        _client = _fixture.CreateHttpClient();
    }

    public async Task DisposeAsync()
    {
        await _fixture.DisposeAsync();
    }

    [Fact]
    public async Task GetGraphQL_RequestFromAllowedOrigin_IncludesCorsHeaders()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Options, "/graphql");
        request.Headers.Add("Origin", "http://localhost:4200");
        request.Headers.Add("Access-Control-Request-Method", "POST");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(
            response.Headers.Contains("Access-Control-Allow-Origin"),
            "Response missing Access-Control-Allow-Origin header");
        Assert.Equal(
            "http://localhost:4200",
            response.Headers.GetValues("Access-Control-Allow-Origin").FirstOrDefault());
    }

    [Fact]
    public async Task GetGraphQL_RequestFromAlternativePort_IncludesCorsHeaders()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Options, "/graphql");
        request.Headers.Add("Origin", "http://localhost:3000");
        request.Headers.Add("Access-Control-Request-Method", "POST");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(
            "http://localhost:3000",
            response.Headers.GetValues("Access-Control-Allow-Origin").FirstOrDefault());
    }

    [Fact]
    public async Task PostGraphQL_AllowsCredentials()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Options, "/graphql");
        request.Headers.Add("Origin", "http://localhost:4200");
        request.Headers.Add("Access-Control-Request-Method", "POST");
        request.Headers.Add("Access-Control-Request-Headers", "authorization");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        Assert.True(
            response.Headers.Contains("Access-Control-Allow-Credentials"),
            "Response missing Access-Control-Allow-Credentials header");
        Assert.Equal(
            "true",
            response.Headers.GetValues("Access-Control-Allow-Credentials").FirstOrDefault());
    }

    [Fact]
    public async Task PostGraphQL_AllowsAnyMethod()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Options, "/graphql");
        request.Headers.Add("Origin", "http://localhost:4200");
        request.Headers.Add("Access-Control-Request-Method", "POST");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        Assert.True(
            response.Headers.Contains("Access-Control-Allow-Methods"),
            "Response missing Access-Control-Allow-Methods header");
    }

    [Fact]
    public async Task GetGraphQL_RequestFromBlockedOrigin_NosCorsHeaders()
    {
        // Arrange
        var request = new HttpRequestMessage(HttpMethod.Options, "/graphql");
        request.Headers.Add("Origin", "http://malicious.com");
        request.Headers.Add("Access-Control-Request-Method", "POST");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        // CORS should not include blocked origin in response
        if (response.Headers.Contains("Access-Control-Allow-Origin"))
        {
            Assert.NotEqual(
                "http://malicious.com",
                response.Headers.GetValues("Access-Control-Allow-Origin").FirstOrDefault());
        }
    }

    [Fact]
    public async Task PostGraphQL_WithValidBuildQuery_AndCorsOrigin_ReturnsData()
    {
        // Arrange
        var query = @"
            query {
                builds(limit: 10, offset: 0) {
                    items { id name }
                    totalCount
                }
            }";

        var request = new HttpRequestMessage(HttpMethod.Post, "/graphql")
        {
            Content = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(new { query }),
                System.Text.Encoding.UTF8,
                "application/json")
        };

        request.Headers.Add("Origin", "http://localhost:4200");

        // Act
        var response = await _client.SendAsync(request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(
            response.Headers.Contains("Access-Control-Allow-Origin"),
            "CORS headers missing on GraphQL POST response");
        Assert.Equal(
            "http://localhost:4200",
            response.Headers.GetValues("Access-Control-Allow-Origin").FirstOrDefault());

        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("builds", content);
    }
}
