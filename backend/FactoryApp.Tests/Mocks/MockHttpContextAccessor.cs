using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace FactoryApp.Tests.Mocks;

/// <summary>
/// Mock IHttpContextAccessor that provides an authenticated HTTP context for tests.
/// </summary>
public class MockHttpContextAccessor : IHttpContextAccessor
{
    private HttpContext? _httpContext;

    public HttpContext? HttpContext
    {
        get => _httpContext ??= CreateAuthenticatedContext();
        set => _httpContext = value;
    }

    /// <summary>
    /// Create a default HTTP context with authenticated user.
    /// </summary>
    private static HttpContext CreateAuthenticatedContext()
    {
        var context = new DefaultHttpContext();
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Email, "test@example.com")
        };
        var identity = new ClaimsIdentity(claims, "Bearer");
        context.User = new ClaimsPrincipal(identity);
        return context;
    }
}
