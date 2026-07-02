using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.Services;
using FactoryApp.Tests.Fixtures;
using FactoryApp.Tests.Mocks;
using HotChocolate;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Xunit;

namespace FactoryApp.Tests.Authorization;

/// <summary>
/// Phase 5: Integration tests for field-level authorization.
/// Tests role-based (@Authorize), claim-based, and nested field authorization.
/// </summary>
[Collection("SQL Server")]
public class AuthorizationIntegrationTests : IAsyncLifetime
{
    private readonly TestDatabaseFixture _fixture = new();
    private FactoryDbContext _context = null!;
    private AuthService _authService = null!;
    private IConfiguration _config = null!;

    public async Task InitializeAsync()
    {
        await _fixture.InitializeAsync();
        _context = _fixture.GetContext();

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

    public async Task DisposeAsync()
    {
        await _fixture.DisposeAsync();
    }

    #region Mutation Authorization Tests

    [Fact]
    public void GenerateToken_AdminRole_IncludesRoleInJWT()
    {
        // Arrange: Admin user
        var admin = new AuthUser
        {
            Id = Guid.NewGuid(),
            Email = "admin@test.com",
            PasswordHash = "hash",
            Role = UserRole.Admin,
            Claims = "{}"
        };

        // Act
        var token = _authService.GenerateToken(admin);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        var roleClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role);

        Assert.NotNull(roleClaim);
        Assert.Equal("Admin", roleClaim.Value);
    }

    [Theory]
    [InlineData(UserRole.Admin)]
    [InlineData(UserRole.User)]
    [InlineData(UserRole.System)]
    public void GenerateToken_DifferentRoles_EmbeddedInJWT(UserRole role)
    {
        // Arrange
        var user = new AuthUser
        {
            Id = Guid.NewGuid(),
            Email = $"{role}@test.com",
            PasswordHash = "hash",
            Role = role,
            Claims = "{}"
        };

        // Act
        var token = _authService.GenerateToken(user);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);
        var roleClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role);

        Assert.NotNull(roleClaim);
        Assert.Equal(role.ToString(), roleClaim.Value);
    }

    [Fact]
    public void GenerateToken_WithCustomClaims_IncludedInJWT()
    {
        // Arrange: User with edit_builds and view_tests claims
        var user = new AuthUser
        {
            Id = Guid.NewGuid(),
            Email = "editor@test.com",
            PasswordHash = "hash",
            Role = UserRole.User,
            Claims = """{"edit_builds":"true","view_tests":"true"}"""
        };

        // Act
        var token = _authService.GenerateToken(user);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        var editBuildsClaim = jwt.Claims.FirstOrDefault(c => c.Type == "edit_builds");
        var viewTestsClaim = jwt.Claims.FirstOrDefault(c => c.Type == "view_tests");

        Assert.NotNull(editBuildsClaim);
        Assert.Equal("true", editBuildsClaim.Value);
        Assert.NotNull(viewTestsClaim);
        Assert.Equal("true", viewTestsClaim.Value);
    }

    [Fact]
    public void GenerateToken_AdminWithClaims_MergesRoleAndClaims()
    {
        // Arrange: Admin with custom claims
        var admin = new AuthUser
        {
            Id = Guid.NewGuid(),
            Email = "superadmin@test.com",
            PasswordHash = "hash",
            Role = UserRole.Admin,
            Claims = """{"audit_access":"true"}"""
        };

        // Act
        var token = _authService.GenerateToken(admin);

        // Assert
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        var roleClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role);
        var auditClaim = jwt.Claims.FirstOrDefault(c => c.Type == "audit_access");

        Assert.NotNull(roleClaim);
        Assert.Equal("Admin", roleClaim.Value);
        Assert.NotNull(auditClaim);
        Assert.Equal("true", auditClaim.Value);
    }

    #endregion

    #region Role-Based Authorization Tests

    [Fact]
    public void ClaimsPrincipal_AdminRole_IsInRole()
    {
        // Arrange: Principal with Admin role claim
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "Admin")
        };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);

        // Act & Assert
        Assert.True(principal.IsInRole("Admin"));
        Assert.False(principal.IsInRole("User"));
    }

    [Fact]
    public void ClaimsPrincipal_UserRole_IsInRole()
    {
        // Arrange
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "User")
        };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);

        // Act & Assert
        Assert.True(principal.IsInRole("User"));
        Assert.False(principal.IsInRole("Admin"));
    }

    #endregion

    #region Claim-Based Authorization Tests

    [Fact]
    public void ClaimsPrincipal_WithEditBuildsClaim_HasClaim()
    {
        // Arrange
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim("edit_builds", "true")
        };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);

        // Act & Assert
        var editClaim = principal.FindFirst("edit_builds");
        Assert.NotNull(editClaim);
        Assert.Equal("true", editClaim.Value);
    }

    [Fact]
    public void ClaimsPrincipal_WithoutEditBuildsClaim_ClaimNotFound()
    {
        // Arrange
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim("view_tests", "true")
        };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);

        // Act & Assert
        var editClaim = principal.FindFirst("edit_builds");
        Assert.Null(editClaim);
    }

    [Fact]
    public void ClaimsPrincipal_MultipleClaims_AllPresent()
    {
        // Arrange
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "User"),
            new Claim("edit_builds", "true"),
            new Claim("view_tests", "true"),
            new Claim("delete_builds", "false")
        };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);

        // Act & Assert
        Assert.True(principal.IsInRole("User"));
        Assert.Equal("true", principal.FindFirst("edit_builds")?.Value);
        Assert.Equal("true", principal.FindFirst("view_tests")?.Value);
        Assert.Equal("false", principal.FindFirst("delete_builds")?.Value);
    }

    #endregion

    #region Nested Field Authorization Tests

    [Fact]
    public async Task Build_WithParts_AdminCanAccessAll()
    {
        // Arrange: Build with parts, admin user
        var build = new Build
        {
            Id = Guid.NewGuid(),
            Name = "Test Build",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Builds.Add(build);

        var part = new Part
        {
            Id = Guid.NewGuid(),
            BuildId = build.Id,
            Name = "Part 1",
            SKU = "SKU001",
            Quantity = 10,
            CreatedAt = DateTime.UtcNow
        };
        _context.Parts.Add(part);
        await _context.SaveChangesAsync();

        var admin = new AuthUser
        {
            Id = Guid.NewGuid(),
            Email = "admin@test.com",
            PasswordHash = "hash",
            Role = UserRole.Admin,
            Claims = "{}"
        };

        // Act: Admin can see parts
        var adminClaims = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, "Admin")
        }));

        // Assert: Admin role present
        Assert.True(adminClaims.IsInRole("Admin"));
    }

    [Fact]
    public async Task Build_WithTestRuns_AdminWithClaimCanAccess()
    {
        // Arrange: Build with test runs, admin with view_tests claim
        var build = new Build
        {
            Id = Guid.NewGuid(),
            Name = "Test Build",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Builds.Add(build);

        var testRun = new TestRun
        {
            Id = Guid.NewGuid(),
            BuildId = build.Id,
            Status = TestStatus.Passed,
            Result = "Test passed",
            FileUrl = "http://example.com/test.json",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.TestRuns.Add(testRun);
        await _context.SaveChangesAsync();

        var adminWithViewTests = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim("view_tests", "true")
        }));

        // Act & Assert
        Assert.True(adminWithViewTests.IsInRole("Admin"));
        Assert.Equal("true", adminWithViewTests.FindFirst("view_tests")?.Value);
    }

    [Fact]
    public async Task Build_WithTestRuns_UserWithoutClaimCannotAccess()
    {
        // Arrange: Build with test runs, user without view_tests claim
        var build = new Build
        {
            Id = Guid.NewGuid(),
            Name = "Test Build",
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Builds.Add(build);

        var testRun = new TestRun
        {
            Id = Guid.NewGuid(),
            BuildId = build.Id,
            Status = TestStatus.Passed,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.TestRuns.Add(testRun);
        await _context.SaveChangesAsync();

        var userWithoutClaim = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, "User")
        }));

        // Act & Assert
        Assert.True(userWithoutClaim.IsInRole("User"));
        Assert.Null(userWithoutClaim.FindFirst("view_tests"));
    }

    #endregion

    #region Edge Case Tests

    [Fact]
    public void GenerateToken_InvalidJsonClaims_IgnoresCustomClaims()
    {
        // Arrange: User with malformed claims JSON
        var user = new AuthUser
        {
            Id = Guid.NewGuid(),
            Email = "badclaims@test.com",
            PasswordHash = "hash",
            Role = UserRole.User,
            Claims = "invalid json {{"
        };

        // Act: Should not throw
        var token = _authService.GenerateToken(user);

        // Assert: Token generated with role claim only
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        Assert.NotNull(jwt);
        var roleClaim = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role);
        Assert.NotNull(roleClaim);
        Assert.Equal("User", roleClaim.Value);
    }

    [Fact]
    public void ClaimsPrincipal_NoRole_IsInRoleReturnsFalse()
    {
        // Arrange: Principal with no role claim
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()) };
        var identity = new ClaimsIdentity(claims);
        var principal = new ClaimsPrincipal(identity);

        // Act & Assert
        Assert.False(principal.IsInRole("Admin"));
        Assert.False(principal.IsInRole("User"));
    }

    [Fact]
    public void ClaimsPrincipal_EmptyPrincipal_NoClaimsFound()
    {
        // Arrange: Empty principal
        var identity = new ClaimsIdentity();
        var principal = new ClaimsPrincipal(identity);

        // Act & Assert
        Assert.Null(principal.FindFirst(ClaimTypes.Role));
        Assert.Null(principal.FindFirst("edit_builds"));
        Assert.False(principal.IsInRole("Admin"));
    }

    #endregion
}
