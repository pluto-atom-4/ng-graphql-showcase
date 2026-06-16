using FactoryApp.GraphQL.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace FactoryApp.Tests;

public class AuthServiceTests
{
    private readonly IConfiguration _config;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        _config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Jwt:Secret", "super-secret-key-for-testing-purposes-only!" },
                { "Jwt:Issuer", "test-issuer" },
                { "Jwt:Audience", "test-audience" },
                { "Jwt:ExpirationHours", "1" }
            })
            .Build();

        _authService = new AuthService(_config);
    }

    [Fact]
    public void HashPassword_WithValidPassword_ReturnsHash()
    {
        // Arrange
        var password = "TestPassword123!";

        // Act
        var hash = _authService.HashPassword(password);

        // Assert
        Assert.NotNull(hash);
        Assert.NotEqual(password, hash);
        Assert.True(hash.Length > 0);
    }

    [Fact]
    public void HashPassword_SamePasswordProducesDifferentHashes()
    {
        // Arrange
        var password = "TestPassword123!";

        // Act
        var hash1 = _authService.HashPassword(password);
        var hash2 = _authService.HashPassword(password);

        // Assert
        Assert.NotEqual(hash1, hash2);
    }

    [Fact]
    public void VerifyPassword_WithCorrectPassword_ReturnsTrue()
    {
        // Arrange
        var password = "TestPassword123!";
        var hash = _authService.HashPassword(password);

        // Act
        var result = _authService.VerifyPassword(password, hash);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void VerifyPassword_WithIncorrectPassword_ReturnsFalse()
    {
        // Arrange
        var password = "TestPassword123!";
        var wrongPassword = "WrongPassword456!";
        var hash = _authService.HashPassword(password);

        // Act
        var result = _authService.VerifyPassword(wrongPassword, hash);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void GenerateToken_WithValidInput_ReturnsToken()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var email = "test@example.com";

        // Act
        var token = _authService.GenerateToken(userId, email);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);
        Assert.Contains(".", token); // JWT has dots separating segments
    }

    [Fact]
    public void GenerateToken_ProducesDifferentTokensForDifferentUsers()
    {
        // Arrange
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();

        // Act
        var token1 = _authService.GenerateToken(userId1, "user1@example.com");
        var token2 = _authService.GenerateToken(userId2, "user2@example.com");

        // Assert
        Assert.NotEqual(token1, token2);
    }

    [Fact]
    public void GenerateToken_WithEmptyEmail_StillGeneratesToken()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var token = _authService.GenerateToken(userId, "");

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);
    }
}
