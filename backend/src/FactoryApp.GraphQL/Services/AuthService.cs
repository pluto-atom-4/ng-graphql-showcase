using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
using BCrypt.Net;
using FactoryApp.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace FactoryApp.GraphQL.Services;

public class AuthService
{
    private readonly IConfiguration _config;

    public AuthService(IConfiguration config)
    {
        _config = config;
    }

    public string HashPassword(string password)
        => BCrypt.Net.BCrypt.HashPassword(password);

    public bool VerifyPassword(string password, string hash)
        => BCrypt.Net.BCrypt.Verify(password, hash);

    public string GenerateToken(AuthUser user)
    {
        var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? _config["Jwt:Secret"]
            ?? throw new InvalidOperationException("Missing JWT_SECRET environment variable or Jwt:Secret in configuration");

        var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secretKey));

        var claimsList = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        try
        {
            var customClaims = JsonSerializer.Deserialize<Dictionary<string, string>>(user.Claims) ?? new();
            foreach (var (claimName, claimValue) in customClaims)
            {
                claimsList.Add(new Claim(claimName, claimValue));
            }
        }
        catch (JsonException)
        {
        }

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "factory-app",
            audience: _config["Jwt:Audience"] ?? "factory-app-users",
            claims: claimsList,
            expires: DateTime.UtcNow.AddHours(int.Parse(_config["Jwt:ExpirationHours"] ?? "1")),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Backwards compatibility overload for existing tests.
    /// Creates a minimal User role token without custom claims.
    /// </summary>
    public string GenerateToken(Guid userId, string email)
    {
        var user = new AuthUser
        {
            Id = userId,
            Email = email,
            PasswordHash = string.Empty,
            Role = UserRole.User,
            Claims = "{}"
        };
        return GenerateToken(user);
    }
}
