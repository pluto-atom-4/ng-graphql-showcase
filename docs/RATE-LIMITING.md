# Rate Limiting Implementation (Issue #147)

Rate limiting protects the GraphQL API from abuse and denial-of-service attacks. Implementation uses Redis for distributed rate-limit state tracking with sliding-window counters.

## Architecture

- **HTTP Middleware**: Per-IP rate limiting at request level
- **Sliding Window**: Requests tracked per minute/hour with Redis Lua scripts
- **Trusted Proxies**: Extracts real client IP from `X-Forwarded-For` header
- **Internal IP Allowlist**: Bypasses limits for internal traffic (10.0.0.0/8, 192.168.0.0/16, etc.)

## Configuration

### appsettings.json

```json
{
  "RateLimiting": {
    "Enabled": false,
    "TrustedProxyHeader": "X-Forwarded-For",
    "AllowedInternalIps": ["127.0.0.1", "::1", "localhost"],
    "PerIp": {
      "RequestsPerMinute": 100,
      "RequestsPerHour": 1000
    },
    "PerUser": {
      "RequestsPerMinute": 200,
      "RequestsPerHour": 5000
    }
  },
  "Redis": {
    "ConnectionString": "localhost:6379"
  }
}
```

### Environment Variables

Override config via environment:

- `RateLimiting__Enabled`: Enable rate limiting
- `Redis__ConnectionString`: Redis connection (format: `host:port` or `host:port,password=xxx,ssl=true`)

## Deployment Rollout

**Stage 1: Monitor only** (disabled in production)

- Deploy with `Enabled: false`
- Verify Redis connectivity for 24h
- Monitor application startup logs

**Stage 2: Per-IP limits** (high threshold)

- Set `Enabled: true`
- RequestsPerMinute: 1000 (very permissive)
- RequestsPerHour: 10000
- Monitor for false positives (legitimate traffic blocked)

**Stage 3: Normal operation**

- Adjust thresholds based on observed traffic patterns
- Monitor Redis CPU/memory
- Enable per-user limits (requires #148 authorization)

## Responses

When rate limit exceeded, API returns:

```json
{
  "errors": [
    {
      "message": "Rate limit exceeded. Retry after 60s."
    }
  ]
}
```

HTTP Status: `429 Too Many Requests`  
Header: `Retry-After: 60`

## Redis Requirements

- **Connection**: Required for production (disabled for development without Redis)
- **Persistence**: Not required (ephemeral counters)
- **Cluster**: Optional, single instance sufficient for MVP
- **Security**: Use AUTH password + TLS in production

### Docker Compose (Development)

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly no
```

## Testing

### Unit Tests

```bash
dotnet test --filter "RateLimitMiddlewareTests"
```

Tests verify:

- Requests allowed under limit
- Requests rejected over limit
- Internal IPs bypass rate limiting
- Non-GraphQL endpoints skip rate limiting
- Retry-After header set correctly

### Integration Testing (Manual)

```bash
# 1. Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# 2. Enable rate limiting
# Edit appsettings.Development.json: "Enabled": true

# 3. Start backend
dotnet run

# 4. Hammer endpoint
for i in {1..150}; do
  curl -X POST http://localhost:5275/graphql \
    -H "Content-Type: application/json" \
    -d '{"query":"{ __typename }"}'
done

# Expect 429s after 100 requests
```

## Known Limitations

- **Phase 2 (GraphQL Directive)**: Blocked by Hot Chocolate v15 directive middleware complexity. HTTP middleware covers majority of use case.
- **Internal Allowlist**: Static list. Consider dynamic allowlist (ClusterIP ranges) for Kubernetes.
- **User-level limits**: Requires #148 (authorization) merged first; user ID extracted from JWT claims.

## Future Enhancements

- [ ] GraphQL directive for operation-specific limits
- [ ] Redis cluster support
- [ ] Rate-limit quota dashboard
- [ ] DDoS fingerprinting (block IPs after N violations)
- [ ] Adaptive thresholds (ML-based anomaly detection)

## Troubleshooting

| Issue                        | Solution                                                        |
| ---------------------------- | --------------------------------------------------------------- |
| "Could not connect to Redis" | Start Redis container: `docker run -p 6379:6379 redis:7-alpine` |
| "Rate limiting not working"  | Check `Enabled: true` in appsettings                            |
| "Legitimate traffic blocked" | Increase thresholds or add IP to allowlist                      |
| "429 errors everywhere"      | Check Redis connection; disable rate limiting if Redis down     |

## Security Considerations

- ✅ IP hashing prevents reverse-lookup attacks
- ✅ Lua scripts prevent race conditions on counter updates
- ✅ Fail-open: If Redis unavailable, requests allowed (not blocked)
- ⚠️ Internal IP range hardcoded (not configurable without code change)
- ⚠️ X-Forwarded-For trusted unconditionally (set `TrustedProxyHeader` to null if behind untrusted proxy)
