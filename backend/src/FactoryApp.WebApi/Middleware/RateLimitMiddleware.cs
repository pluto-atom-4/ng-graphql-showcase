using StackExchange.Redis;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace FactoryApp.WebApi.Middleware;

public class RateLimitOptions
{
    public bool Enabled { get; set; } = true;
    public PerIpRateLimitOptions PerIp { get; set; } = new();
    public PerUserRateLimitOptions PerUser { get; set; } = new();
    public List<string> AllowedInternalIps { get; set; } = new() { "127.0.0.1", "::1", "localhost" };
    public string? TrustedProxyHeader { get; set; } = "X-Forwarded-For";
}

public class PerIpRateLimitOptions
{
    public int RequestsPerMinute { get; set; } = 100;
    public int RequestsPerHour { get; set; } = 1000;
}

public class PerUserRateLimitOptions
{
    public int RequestsPerMinute { get; set; } = 200;
    public int RequestsPerHour { get; set; } = 5000;
}

public class RateLimitMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RateLimitMiddleware> _logger;
    private readonly IConnectionMultiplexer _redis;
    private readonly RateLimitOptions _options;
    private readonly IDatabase _db;

    public RateLimitMiddleware(
        RequestDelegate next,
        ILogger<RateLimitMiddleware> logger,
        IConnectionMultiplexer redis,
        RateLimitOptions options)
    {
        _next = next;
        _logger = logger;
        _redis = redis;
        _options = options;
        _db = redis.GetDatabase();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!_options.Enabled || !context.Request.Path.StartsWithSegments("/graphql"))
        {
            await _next(context);
            return;
        }

        var clientIp = ExtractClientIp(context);

        // Skip rate limiting for internal IPs (0.0.0.0/8, 10.0.0.0/8, 127.0.0.1, etc.)
        if (IsInternalIp(clientIp))
        {
            await _next(context);
            return;
        }

        // Check per-IP rate limits
        var ipLimitKey = BuildLimitKey("ip", HashIp(clientIp));
        if (!await CheckRateLimit(context, ipLimitKey, _options.PerIp.RequestsPerMinute, "minute"))
        {
            return;
        }

        if (!await CheckRateLimit(context, ipLimitKey, _options.PerIp.RequestsPerHour, "hour"))
        {
            return;
        }

        // Check per-user rate limits (authenticated only)
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? context.User.FindFirst("sub")?.Value;

        if (!string.IsNullOrEmpty(userId))
        {
            var userLimitKey = BuildLimitKey("user", userId);
            if (!await CheckRateLimit(context, userLimitKey, _options.PerUser.RequestsPerMinute, "minute"))
            {
                return;
            }

            if (!await CheckRateLimit(context, userLimitKey, _options.PerUser.RequestsPerHour, "hour"))
            {
                return;
            }
        }

        await _next(context);
    }

    private async Task<bool> CheckRateLimit(HttpContext context, string baseKey, int limit, string window)
    {
        var windowKey = $"{baseKey}:{window}";
        var expirationSeconds = window == "minute" ? 60 : 3600;

        try
        {
            var luaScript = @"
                local key = KEYS[1]
                local limit = tonumber(ARGV[1])
                local expiry = tonumber(ARGV[2])
                local now = redis.call('time')[1]

                local current = redis.call('get', key)
                if not current then
                    redis.call('set', key, 1)
                    redis.call('expire', key, expiry)
                    return 1
                end

                current = tonumber(current)
                if current < limit then
                    redis.call('incr', key)
                    return current + 1
                end

                return -1
            ";

            var result = await _db.ScriptEvaluateAsync(
                luaScript,
                new RedisKey[] { windowKey },
                new RedisValue[] { limit, expirationSeconds });

            var count = (long?)result ?? -1;

            if (count == -1)
            {
                _logger.LogWarning("Rate limit exceeded for key {Key}", windowKey);
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                context.Response.Headers["Retry-After"] = expirationSeconds.ToString();
                await context.Response.WriteAsJsonAsync(new
                {
                    errors = new[] { new { message = $"Rate limit exceeded. Retry after {expirationSeconds}s." } }
                });
                return false;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking rate limit for key {Key}", windowKey);
            // Fail open: allow request if Redis is down
            return true;
        }

        return true;
    }

    private string ExtractClientIp(HttpContext context)
    {
        var ip = context.Connection.RemoteIpAddress?.ToString();

        if (_options.TrustedProxyHeader != null &&
            context.Request.Headers.TryGetValue(_options.TrustedProxyHeader, out var forwardedFor))
        {
            var ips = forwardedFor.ToString().Split(',');
            if (ips.Length > 0)
            {
                ip = ips[0].Trim();
            }
        }

        return ip ?? "0.0.0.0";
    }

    private bool IsInternalIp(string ip)
    {
        if (_options.AllowedInternalIps.Contains(ip))
            return true;

        // Check private IP ranges
        return ip.StartsWith("10.") ||
               ip.StartsWith("172.16.") || ip.StartsWith("172.17.") || ip.StartsWith("172.18.") ||
               ip.StartsWith("172.19.") || ip.StartsWith("172.20.") || ip.StartsWith("172.21.") ||
               ip.StartsWith("172.22.") || ip.StartsWith("172.23.") || ip.StartsWith("172.24.") ||
               ip.StartsWith("172.25.") || ip.StartsWith("172.26.") || ip.StartsWith("172.27.") ||
               ip.StartsWith("172.28.") || ip.StartsWith("172.29.") || ip.StartsWith("172.30.") ||
               ip.StartsWith("172.31.") ||
               ip.StartsWith("192.168.");
    }

    private string HashIp(string ip)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(ip));
        return Convert.ToHexString(hash).ToLower();
    }

    private string BuildLimitKey(string type, string identifier)
    {
        return $"rl:{type}:{identifier}";
    }
}
