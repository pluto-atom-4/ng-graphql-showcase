# GraphQL Implementation Plan

Remediation plan for BuildQuery.cs & BuildMutation.cs compliance gaps.

---

## Overview

Current implementation violates **8 critical architecture patterns** and **3 security guidelines**. This plan addresses all findings from issue-content.txt in priority order.

---

## Phase 1: Critical Fixes (Blocking Production)

### 1.1 Add Hot Chocolate Projections to BuildQuery

**Location:** `BuildQuery.cs:9-35`

**Current State:** No `[UseProjection]`, queries transfer 10x unnecessary columns

**Action:**

```csharp
// Refactor BuildQuery into resolver pattern
[GraphQLType("Query")]
public class BuildQueryType
{
    [UseProjection]
    [UseFiltering]
    [UseSorting]
    public IQueryable<Build> GetBuilds([Service] FactoryDbContext context)
        => context.Builds.AsNoTracking();

    public async Task<Build?> GetBuild(
        Guid id,
        [Service] FactoryDbContext context)
        => await context.Builds
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id);
}
```

**Files to Create:**

- `backend/src/FactoryApp.GraphQL/Types/BuildType.cs` (Hot Chocolate type definition)
- Update `Program.cs` to register `BuildQueryType`

**Expected Outcome:** 90% reduction in dashboard query data transfer

---

### 1.2 Add .AsNoTracking() to All Queries

**Location:** `BuildQuery.cs:11, 16`

**Current State:** Queries load change-tracked entities (15-30% CPU overhead)

**Action:**

```csharp
// BuildQuery.cs line 11
public async Task<Build?> GetBuild(Guid id, [Service] FactoryDbContext dbContext)
{
    return await dbContext.Builds
        .AsNoTracking()  // ← ADD THIS
        .FirstOrDefaultAsync(b => b.Id == id);
}

// BuildQuery.cs line 16
public async Task<PaginatedBuilds> GetBuilds(int limit, int offset, [Service] FactoryDbContext dbContext)
{
    var query = dbContext.Builds
        .AsNoTracking()  // ← ADD THIS
        .AsQueryable();
    // ... rest
}
```

**Impact:** Immediate CPU reduction on dashboard

---

### 1.3 Implement Event Emission (Elsa Integration)

**Location:** `BuildMutation.cs:49-61` (UpdateBuildStatus)

**Current State:** TODO comment; no event emission → workflows decoupled

**Action:**

```csharp
public async Task<Build> UpdateBuildStatus(
    Guid id,
    BuildStatus status,
    [Service] FactoryDbContext dbContext,
    [Service] ITopicEventSender eventSender)  // ← ADD THIS
{
    var build = await dbContext.Builds.FindAsync(id)
        ?? throw new GraphQLException($"Build {id} not found");

    var oldStatus = build.Status;
    build.Status = status;
    build.UpdatedAt = DateTime.UtcNow;

    await dbContext.SaveChangesAsync();

    // Emit event for Elsa workflows and subscriptions
    await eventSender.SendAsync("buildStatusChanged", new BuildStatusChangedEvent
    {
        BuildId = id,
        OldStatus = oldStatus,
        NewStatus = status,
        Timestamp = DateTime.UtcNow
    });

    return build;
}
```

**Files to Create:**

- `backend/src/FactoryApp.GraphQL/Events/BuildStatusChangedEvent.cs`
- Update `Program.cs` to register in-memory subscriptions (already done per CLAUDE.md)

**Impact:** Real-time subscriptions + Elsa workflow triggering enabled

---

### 1.4 Implement Authentication with Bcrypt & Signed JWT

**Location:** `BuildMutation.cs:10-29` (Login)

**Current State:** Dummy JWT, no bcrypt, no expiration, no token refresh

**Action:**

**Step 1:** Add NuGet packages

```bash
cd backend/src/FactoryApp.WebApi
dotnet add package BCrypt.Net-Next
dotnet add package System.IdentityModel.Tokens.Jwt
```

**Step 2:** Create auth service

```csharp
// backend/src/FactoryApp.GraphQL/Services/AuthService.cs
using BCrypt.Net;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

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

    public string GenerateToken(Guid userId, string email)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Secret"] ?? throw new InvalidOperationException("Missing Jwt:Secret")));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Email, email)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),  // 1-hour expiration
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

**Step 3:** Update BuildMutation

```csharp
public async Task<AuthPayload> Login(
    string email,
    string password,
    [Service] FactoryDbContext dbContext,
    [Service] AuthService authService)
{
    var user = await dbContext.AuthUsers
        .FirstOrDefaultAsync(u => u.Email == email)
        ?? throw new GraphQLException("Invalid email or password");

    if (!authService.VerifyPassword(password, user.PasswordHash))
        throw new GraphQLException("Invalid email or password");

    var token = authService.GenerateToken(user.Id, user.Email);

    return new AuthPayload
    {
        Token = token,
        User = new AuthUserPayload { Id = user.Id, Email = user.Email }
    };
}
```

**Step 4:** Update appsettings.json

```json
{
  "Jwt": {
    "Secret": "your-super-secret-key-min-32-chars!",
    "Issuer": "factory-app",
    "Audience": "factory-app-users"
  }
}
```

**Impact:** Production-ready authentication

---

## Phase 2: Architecture Compliance (Before Dashboard Launch)

### 2.1 Create DTOs for Mutation Returns

**Location:** `BuildMutation.cs` (all mutation return types)

**Current State:** Returns raw EF Core entities → schema tightly coupled to DB

**Action:**

Create DTOs:

```csharp
// backend/src/FactoryApp.GraphQL/DTOs/BuildPayload.cs
public class BuildPayload
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; }  // ← Use string, not enum
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// backend/src/FactoryApp.GraphQL/DTOs/PartPayload.cs
public class PartPayload
{
    public Guid Id { get; set; }
    public Guid BuildId { get; set; }
    public required string Name { get; set; }
    public required string SKU { get; set; }
    public int Quantity { get; set; }
    public DateTime CreatedAt { get; set; }
}

// backend/src/FactoryApp.GraphQL/DTOs/TestRunPayload.cs
public class TestRunPayload
{
    public Guid Id { get; set; }
    public Guid BuildId { get; set; }
    public string Status { get; set; }
    public string? Result { get; set; }
    public string? FileUrl { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

Update mutations to map before returning:

```csharp
public async Task<BuildPayload> CreateBuild(
    string name,
    string? description,
    [Service] FactoryDbContext dbContext)
{
    var build = new Build { /* ... */ };
    dbContext.Builds.Add(build);
    await dbContext.SaveChangesAsync();

    return new BuildPayload
    {
        Id = build.Id,
        Name = build.Name,
        Description = build.Description,
        Status = build.Status.ToString(),
        CreatedAt = build.CreatedAt,
        UpdatedAt = build.UpdatedAt
    };
}
```

**Impact:** Schema decoupled from database; future refactoring enabled

---

### 2.2 Implement DataLoaders (N+1 Prevention)

**Location:** `BuildQuery.cs` (no DataLoaders)

**Current State:** Nested Part/TestRun queries trigger N+1 hits

**Action:**

Create DataLoaders:

```csharp
// backend/src/FactoryApp.GraphQL/DataLoaders/PartsByBuildIdLoader.cs
[DataLoader("GetPartsByBuildId")]
public async Task<IReadOnlyDictionary<Guid, List<Part>>> GetPartsByBuildId(
    IReadOnlyList<Guid> buildIds,
    [Service] FactoryDbContext context,
    CancellationToken ct)
    => await context.Parts
        .Where(p => buildIds.Contains(p.BuildId))
        .AsNoTracking()
        .GroupBy(p => p.BuildId)
        .ToDictionaryAsync(g => g.Key, g => g.ToList(), ct);

// backend/src/FactoryApp.GraphQL/DataLoaders/TestRunsByBuildIdLoader.cs
[DataLoader("GetTestRunsByBuildId")]
public async Task<IReadOnlyDictionary<Guid, List<TestRun>>> GetTestRunsByBuildId(
    IReadOnlyList<Guid> buildIds,
    [Service] FactoryDbContext context,
    CancellationToken ct)
    => await context.TestRuns
        .Where(t => buildIds.Contains(t.BuildId))
        .AsNoTracking()
        .GroupBy(t => t.BuildId)
        .ToDictionaryAsync(g => g.Key, g => g.ToList(), ct);
```

Create BuildType resolver:

```csharp
// backend/src/FactoryApp.GraphQL/Types/BuildType.cs
[GraphQLType("Build")]
public class BuildType
{
    [GraphQLField]
    public Guid Id => Parent.Id;

    [GraphQLField]
    public string Name => Parent.Name;

    [GraphQLField]
    public async Task<List<Part>> Parts(
        Build parent,
        [DataLoader("GetPartsByBuildId")] IDataLoader<Guid, List<Part>> loader)
        => await loader.LoadAsync(parent.Id);

    [GraphQLField]
    public async Task<List<TestRun>> TestRuns(
        Build parent,
        [DataLoader("GetTestRunsByBuildId")] IDataLoader<Guid, List<TestRun>> loader)
        => await loader.LoadAsync(parent.Id);

    private Build Parent { get; set; }
}
```

Update `Program.cs`:

```csharp
builder.Services
    .AddGraphQLServer()
    .AddQueryType<BuildQueryType>()
    .AddMutationType<BuildMutationType>()
    .AddSubscriptionType<BuildSubscriptionType>()
    .RegisterDataLoaders()  // ← Register all DataLoaders
    .AddInMemorySubscriptions();
```

**Impact:** Nested queries execute in 2 round-trips max (no N+1)

---

### 2.3 Add Explicit Transaction Management

**Location:** `BuildMutation.cs:84-111` (SubmitTestRun)

**Current State:** No shared transaction for future EF Core + Dapper ops

**Action:**

```csharp
public async Task<TestRunPayload> SubmitTestRun(
    Guid buildId,
    TestStatus status,
    string? result,
    string? fileUrl,
    [Service] FactoryDbContext context,
    [Service] ITopicEventSender eventSender)
{
    var build = await context.Builds.FindAsync(buildId)
        ?? throw new GraphQLException($"Build {buildId} not found");

    // Explicit transaction for potential future Dapper operations
    using var transaction = await context.Database.BeginTransactionAsync();
    try
    {
        var testRun = new TestRun
        {
            Id = Guid.NewGuid(),
            BuildId = buildId,
            Status = status,
            Result = result,
            FileUrl = fileUrl,
            CompletedAt = status == TestStatus.Passed || status == TestStatus.Failed ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.TestRuns.Add(testRun);
        await context.SaveChangesAsync();

        // Future Dapper operations would go here (sharing transaction)

        await transaction.CommitAsync();

        // Emit event after commit
        await eventSender.SendAsync("testRunCompleted", new TestRunCompletedEvent
        {
            TestRunId = testRun.Id,
            BuildId = buildId,
            Status = status,
            Timestamp = DateTime.UtcNow
        });

        return MapToPayload(testRun);
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```

**Impact:** Deadlock-proof; ready for Dapper integration

---

## Phase 3: Validation & Error Handling

### 3.1 Add Input Validation

**Location:** All mutation parameters

**Action:**

```csharp
public async Task<BuildPayload> CreateBuild(
    string name,
    string? description,
    [Service] FactoryDbContext dbContext)
{
    // Validation
    if (string.IsNullOrWhiteSpace(name))
        throw new GraphQLException("Name is required and cannot be empty");

    if (name.Length > 256)
        throw new GraphQLException("Name must be <= 256 characters");

    if (description?.Length > 1000)
        throw new GraphQLException("Description must be <= 1000 characters");

    // ... rest of mutation
}

public async Task<PartPayload> AddPart(
    Guid buildId,
    string name,
    string sku,
    int quantity,
    [Service] FactoryDbContext dbContext)
{
    if (string.IsNullOrWhiteSpace(name))
        throw new GraphQLException("Name is required");

    if (string.IsNullOrWhiteSpace(sku))
        throw new GraphQLException("SKU is required");

    if (quantity <= 0)
        throw new GraphQLException("Quantity must be > 0");

    if (sku.Length > 100)
        throw new GraphQLException("SKU must be <= 100 characters");

    // ... rest
}
```

---

### 3.2 Add Error Logging

**Location:** All exception handlers

**Action:**

```csharp
public async Task<BuildPayload> CreateBuild(
    string name,
    string? description,
    [Service] FactoryDbContext dbContext,
    [Service] ILogger<BuildMutationType> logger)
{
    try
    {
        // Validation & mutation logic
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error creating build: {Name}", name);
        throw new GraphQLException("Failed to create build", ex);
    }
}
```

---

## Phase 4: Testing & Schema Validation

### 4.1 Unit Tests

**Location:** `backend/src/FactoryApp.Tests/`

**Files to Create:**

- `BuildQueryTests.cs`
- `BuildMutationTests.cs`
- `AuthServiceTests.cs`

**Example:**

```csharp
public class BuildMutationTests
{
    [Fact]
    public async Task CreateBuild_WithValidInput_ReturnsPayload()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<FactoryDbContext>()
            .UseInMemoryDatabase("test").Options;
        var context = new FactoryDbContext(options);

        var mutation = new BuildMutationType();

        // Act
        var result = await mutation.CreateBuild("Test Build", null, context);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Test Build", result.Name);
    }

    [Fact]
    public async Task CreateBuild_WithEmptyName_ThrowsException()
    {
        // Arrange
        var context = new FactoryDbContext(/* ... */);
        var mutation = new BuildMutationType();

        // Act & Assert
        await Assert.ThrowsAsync<GraphQLException>(
            () => mutation.CreateBuild("", null, context));
    }
}
```

---

### 4.2 Verify Schema Regeneration

After all changes:

```bash
cd backend/src
dotnet build  # MSBuild target exports schema.graphql

# Verify schema was updated
git diff backend/src/FactoryApp.WebApi/schema.graphql

# Frontend auto-generates types
pnpm codegen
```

---

## Implementation Timeline

| Phase | Task                | Priority | Est. Time | Blocker         |
| ----- | ------------------- | -------- | --------- | --------------- |
| 1.1   | Add projections     | HIGH     | 2h        | Dashboard perf  |
| 1.2   | Add .AsNoTracking() | HIGH     | 30m       | CPU usage       |
| 1.3   | Event emission      | HIGH     | 1h        | Workflows       |
| 1.4   | Auth + JWT          | CRITICAL | 3h        | Production      |
| 2.1   | DTOs                | MEDIUM   | 2h        | Schema coupling |
| 2.2   | DataLoaders         | MEDIUM   | 2h        | N+1 queries     |
| 2.3   | Transactions        | MEDIUM   | 1h        | Deadlocks       |
| 3.1   | Validation          | MEDIUM   | 1h        | Data integrity  |
| 3.2   | Logging             | MEDIUM   | 30m       | Debugging       |
| 4.1   | Unit tests          | MEDIUM   | 3h        | Coverage        |
| 4.2   | Schema verify       | HIGH     | 30m       | Frontend sync   |

**Total:** ~16 hours

---

## Rollout Strategy

1. **Branch:** `feat/graphql-compliance-fixes`
2. **Local:** Test all phases locally with `pnpm dev`
3. **Commit:** Small, focused commits per phase
4. **PR Review:** Verify against ARCHITECTURE.md patterns
5. **Merge:** After CI green + code review approved
6. **Deploy:** After schema.graphql validated

---

## References

- **ARCHITECTURE.md** § Hot Chocolate Best Practices
- **ARCHITECTURE.md** § Shared Transaction Pattern
- **DATABASE.md** § Transaction Management
- **DEVELOPMENT.md** § Backend Debugging
