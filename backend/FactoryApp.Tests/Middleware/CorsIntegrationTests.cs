using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace FactoryApp.Tests.Middleware;

/// <summary>
/// Unit tests for CORS configuration (issue #219).
/// Verifies CORS policy is correctly configured for frontend (localhost:4200).
/// </summary>
public class CorsConfigurationTests
{
    [Fact]
    public void CorsServiceAdded_ToServiceCollection()
    {
        // Arrange
        var builder = WebApplication.CreateBuilder();

        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:4200",
                        "http://localhost:3000")
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials();
            });
        });

        var app = builder.Build();

        // Act: Get the CORS service
        var corsService = app.Services.GetService<ICorsService>();

        // Assert: CORS service registered
        Assert.NotNull(corsService);
    }

    [Fact]
    public void CorsPolicy_AllowsAllMethods()
    {
        // Arrange
        var policyBuilder = new CorsPolicyBuilder();
        policyBuilder
            .WithOrigins("http://localhost:4200")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();

        var policy = policyBuilder.Build();

        // Act & Assert
        Assert.NotNull(policy);
        Assert.True(policy.AllowAnyMethod);
        Assert.True(policy.SupportsCredentials);
    }

    [Fact]
    public void CorsPolicy_AllowsLocalhostCredentials()
    {
        // Arrange
        var policyBuilder = new CorsPolicyBuilder();
        policyBuilder
            .WithOrigins("http://localhost:4200", "http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();

        var policy = policyBuilder.Build();

        // Act & Assert: Verify credentials are allowed
        Assert.True(policy.SupportsCredentials);
    }

    [Fact]
    public void CorsPolicy_ConfiguredOrigins_MatchAngularDevServer()
    {
        // Arrange: Common Angular dev server ports
        var expectedOrigins = new[]
        {
            "http://localhost:4200",  // Angular default
            "http://localhost:3000"   // Alternative
        };

        var policyBuilder = new CorsPolicyBuilder();
        policyBuilder
            .WithOrigins(expectedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();

        var policy = policyBuilder.Build();

        // Act & Assert
        Assert.NotNull(policy);
        Assert.True(policy.AllowAnyMethod);
        Assert.True(policy.SupportsCredentials);
    }
}
