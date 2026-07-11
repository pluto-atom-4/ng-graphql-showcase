using HotChocolate;

namespace FactoryApp.GraphQL.Directives;

/// <summary>
/// GraphQL directive for operation-specific rate limiting.
///
/// STATUS: Scaffolded only (schema registration, no middleware integration).
/// Per-IP rate limiting is handled at HTTP middleware level (see RateLimitMiddleware).
///
/// WHY SCAFFOLDED ONLY:
/// Hot Chocolate v15.1 directive middleware is complex; requires custom FieldMiddleware
/// implementation. Directive middleware runs AFTER resolver execution (not before),
/// making it unsuitable for rate-limit enforcement (requests already counted toward limit).
///
/// WORKAROUND:
/// HTTP middleware (RateLimitMiddleware) covers 100% of use cases for MVP:
/// - Per-IP limits apply to all GraphQL operations
/// - Per-user limits (post-#148) extracted from JWT claims
/// - No need for per-operation targeting; uniform limits more secure
///
/// FUTURE ENHANCEMENT (Phase 5):
/// - Upgrade to Hot Chocolate v16+ (if available) with better directive middleware
/// - Or implement custom field interceptor for operation-specific limits
/// - Track in issue: #xyz (Phase 5 - GraphQL directive middleware)
///
/// USAGE (for future implementation):
/// @rateLimit(requestsPerMinute: 50) on FIELD_DEFINITION
/// </summary>
[GraphQLName("rateLimit")]
public class RateLimitDirective
{
    public int RequestsPerMinute { get; set; } = 200;
}

