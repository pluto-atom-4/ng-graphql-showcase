using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using HotChocolate;

namespace FactoryApp.GraphQL;

public class BuildMutation
{
    public async Task<AuthPayload> Login(string email, string password, FactoryDbContext dbContext)
    {
        // TODO: Implement proper authentication with password hashing (bcrypt/Argon2)
        var user = await dbContext.AuthUsers
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null)
        {
            throw new GraphQLException("Invalid email or password");
        }

        // TODO: Verify password hash and generate JWT token
        var token = GenerateDummyJwt(user.Id);

        return new AuthPayload
        {
            Token = token,
            User = new AuthUserPayload { Id = user.Id, Email = user.Email }
        };
    }

    public async Task<Build> CreateBuild(string name, string? description, FactoryDbContext dbContext)
    {
        var build = new Build
        {
            Id = Guid.NewGuid(),
            Name = name,
            Description = description,
            Status = BuildStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        dbContext.Builds.Add(build);
        await dbContext.SaveChangesAsync();

        return build;
    }

    public async Task<Build> UpdateBuildStatus(Guid id, BuildStatus status, FactoryDbContext dbContext)
    {
        var build = await dbContext.Builds.FindAsync(id)
            ?? throw new GraphQLException($"Build {id} not found");

        build.Status = status;
        build.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        // TODO: Emit buildStatusChanged event to Elsa workflow and hot chocolate subscriptions
        return build;
    }

    public async Task<Part> AddPart(Guid buildId, string name, string sku, int quantity, FactoryDbContext dbContext)
    {
        var build = await dbContext.Builds.FindAsync(buildId)
            ?? throw new GraphQLException($"Build {buildId} not found");

        var part = new Part
        {
            Id = Guid.NewGuid(),
            BuildId = buildId,
            Name = name,
            SKU = sku,
            Quantity = quantity,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Parts.Add(part);
        await dbContext.SaveChangesAsync();

        return part;
    }

    public async Task<TestRun> SubmitTestRun(
        Guid buildId,
        TestStatus status,
        string? result,
        string? fileUrl,
        FactoryDbContext dbContext)
    {
        var build = await dbContext.Builds.FindAsync(buildId)
            ?? throw new GraphQLException($"Build {buildId} not found");

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

        dbContext.TestRuns.Add(testRun);
        await dbContext.SaveChangesAsync();

        // TODO: Emit testRunCompleted event to Elsa workflow and hot chocolate subscriptions
        return testRun;
    }

    private static string GenerateDummyJwt(Guid userId)
    {
        // TODO: Implement proper JWT generation with signing key
        return $"dummy.jwt.token.for.{userId}";
    }
}

public class AuthPayload
{
    public required string Token { get; set; }
    public required AuthUserPayload User { get; set; }
}

public class AuthUserPayload
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
}
