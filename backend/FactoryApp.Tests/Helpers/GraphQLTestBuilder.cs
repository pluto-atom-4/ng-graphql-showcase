using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL;
using FactoryApp.GraphQL.DTOs;
using FactoryApp.GraphQL.Services;
using FactoryApp.Tests.Mocks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace FactoryApp.Tests.Helpers;

/// <summary>
/// Fluent builder for constructing GraphQL query/mutation test scenarios.
/// Encapsulates resolver setup, logging, and dependency injection.
/// </summary>
public class GraphQLTestBuilder
{
    private FactoryDbContext _context = null!;
    private LoggingService _loggingService = null!;
    private AuthService _authService = null!;
    private IHttpContextAccessor _httpContextAccessor = null!;

    public GraphQLTestBuilder WithContext(FactoryDbContext context)
    {
        _context = context;
        return this;
    }

    public GraphQLTestBuilder WithLoggingService(LoggingService loggingService)
    {
        _loggingService = loggingService;
        return this;
    }

    public GraphQLTestBuilder WithAuthService(AuthService authService)
    {
        _authService = authService;
        return this;
    }

    public GraphQLTestBuilder WithHttpContextAccessor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
        return this;
    }

    public GraphQLTestBuilder WithDefaults()
    {
        if (_loggingService == null)
        {
            var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
            _loggingService = new LoggingService(loggerFactory.CreateLogger<LoggingService>());
        }

        if (_httpContextAccessor == null)
        {
            _httpContextAccessor = new MockHttpContextAccessor();
        }

        return this;
    }

    public QueryTestContext BuildQueryContext()
    {
        WithDefaults();
        return new QueryTestContext(_context, _loggingService);
    }

    public MutationTestContext BuildMutationContext()
    {
        WithDefaults();
        return new MutationTestContext(_context, _loggingService, _authService, _httpContextAccessor);
    }
}

/// <summary>
/// Query resolver test context with dependencies pre-wired.
/// Provides type-safe access to build query resolvers.
/// </summary>
public class QueryTestContext
{
    private readonly FactoryDbContext _context;
    private readonly LoggingService _loggingService;
    private readonly BuildQueryType _query;

    public QueryTestContext(FactoryDbContext context, LoggingService loggingService)
    {
        _context = context;
        _loggingService = loggingService;
        _query = new BuildQueryType();
    }

    public BuildQueryType Query => _query;
    public FactoryDbContext Context => _context;
    public LoggingService Logging => _loggingService;

    public async Task<Build?> GetBuild(Guid buildId) =>
        await _query.GetBuild(buildId, _context, _loggingService);

    public IQueryable<Build> GetBuilds() =>
        _query.GetBuilds(_context);

    public async Task<PaginatedBuilds> GetBuildsPaginated(int limit, int offset) =>
        await _query.GetBuildsPaginated(limit, offset, _context, _loggingService);
}

/// <summary>
/// Mutation resolver test context with dependencies pre-wired.
/// Provides type-safe access to build mutation resolvers.
/// </summary>
public class MutationTestContext
{
    private readonly FactoryDbContext _context;
    private readonly LoggingService _loggingService;
    private readonly AuthService _authService;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly BuildMutationType _mutation;

    public MutationTestContext(
        FactoryDbContext context,
        LoggingService loggingService,
        AuthService authService,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _loggingService = loggingService;
        _authService = authService;
        _httpContextAccessor = httpContextAccessor;
        _mutation = new BuildMutationType();
    }

    public BuildMutationType Mutation => _mutation;
    public FactoryDbContext Context => _context;
    public LoggingService Logging => _loggingService;
    public AuthService Auth => _authService;

    public async Task<BuildPayload> CreateBuild(string name, string? description) =>
        await _mutation.CreateBuild(name, description, _context, _loggingService, _httpContextAccessor);

    public async Task<BuildPayload> UpdateBuildStatus(Guid buildId, BuildStatus status, MockTopicEventSender eventSender) =>
        await _mutation.UpdateBuildStatus(buildId, status, _context, eventSender, _loggingService, _httpContextAccessor);

    public async Task<PartPayload> AddPart(Guid buildId, string name, string sku, int quantity) =>
        await _mutation.AddPart(buildId, name, sku, quantity, _context, _loggingService, _httpContextAccessor);

    public async Task<TestRunPayload> SubmitTestRun(Guid buildId, TestStatus status, string? result, string? fileUrl, MockTopicEventSender eventSender) =>
        await _mutation.SubmitTestRun(buildId, status, result, fileUrl, _context, eventSender, _loggingService, _httpContextAccessor);
}
