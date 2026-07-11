using FactoryApp.WebApi.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using StackExchange.Redis;
using Xunit;

namespace FactoryApp.Tests;

public class RateLimitMiddlewareTests
{
    [Fact]
    public async Task Middleware_DisabledByDefault()
    {
        // Arrange
        var options = new RateLimitOptions { Enabled = false };
        var logger = new Mock<ILogger<RateLimitMiddleware>>();
        var redisMock = new Mock<IConnectionMultiplexer>();
        var nextCalled = false;

        RequestDelegate next = async (ctx) =>
        {
            nextCalled = true;
            await Task.CompletedTask;
        };

        var middleware = new RateLimitMiddleware(next, logger.Object, redisMock.Object, options);
        var httpContext = CreateHttpContext("192.168.1.1");

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.True(nextCalled);
    }

    [Fact]
    public async Task Middleware_SkipsNonGraphQLEndpoints()
    {
        // Arrange
        var options = new RateLimitOptions { Enabled = true };
        var logger = new Mock<ILogger<RateLimitMiddleware>>();
        var redisMock = new Mock<IConnectionMultiplexer>();
        var nextCalled = false;

        RequestDelegate next = async (ctx) =>
        {
            nextCalled = true;
            await Task.CompletedTask;
        };

        var middleware = new RateLimitMiddleware(next, logger.Object, redisMock.Object, options);
        var httpContext = CreateHttpContext("192.168.1.1");
        httpContext.Request.Path = "/api/health";

        // Act
        await middleware.InvokeAsync(httpContext);

        // Assert
        Assert.True(nextCalled);
    }

    [Fact]
    public async Task Middleware_AllowsInternalIps()
    {
        // Arrange
        var options = new RateLimitOptions { Enabled = true };
        var logger = new Mock<ILogger<RateLimitMiddleware>>();
        var redisMock = new Mock<IConnectionMultiplexer>();
        var nextCalls = 0;

        RequestDelegate next = async (ctx) =>
        {
            nextCalls++;
            await Task.CompletedTask;
        };

        var middleware = new RateLimitMiddleware(next, logger.Object, redisMock.Object, options);

        // Act: Multiple requests from internal IPs
        foreach (var ip in new[] { "127.0.0.1", "10.0.0.5", "192.168.1.1" })
        {
            var httpContext = CreateHttpContext(ip);
            await middleware.InvokeAsync(httpContext);
        }

        // Assert
        Assert.Equal(3, nextCalls);
    }

    private static HttpContext CreateHttpContext(string clientIp)
    {
        var context = new DefaultHttpContext
        {
            Connection = { RemoteIpAddress = System.Net.IPAddress.Parse(clientIp) },
            Request =
            {
                Path = "/graphql",
                Method = "POST",
                ContentType = "application/json"
            },
            Response = { Body = new MemoryStream() }
        };
        return context;
    }
}
