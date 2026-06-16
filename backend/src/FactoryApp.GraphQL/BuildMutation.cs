using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.Events;
using FactoryApp.GraphQL.Services;
using HotChocolate;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.GraphQL;

[GraphQLType("Mutation")]
public class BuildMutationType
{
    [GraphQLField]
    public async Task<AuthPayload> Login(
        string email,
        string password,
        [Service] FactoryDbContext dbContext,
        [Service] AuthService authService)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new GraphQLException("Email is required");

        if (string.IsNullOrWhiteSpace(password))
            throw new GraphQLException("Password is required");

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

    [GraphQLField]
    public async Task<Build> CreateBuild(
        string name,
        string? description,
        [Service] FactoryDbContext dbContext)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new GraphQLException("Name is required and cannot be empty");

        if (name.Length > 256)
            throw new GraphQLException("Name must be <= 256 characters");

        if (description?.Length > 1000)
            throw new GraphQLException("Description must be <= 1000 characters");

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

    [GraphQLField]
    public async Task<Build> UpdateBuildStatus(
        Guid id,
        BuildStatus status,
        [Service] FactoryDbContext dbContext,
        [Service] ITopicEventSender eventSender)
    {
        var build = await dbContext.Builds.FindAsync(id)
            ?? throw new GraphQLException($"Build {id} not found");

        var oldStatus = build.Status;
        build.Status = status;
        build.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        await eventSender.SendAsync("buildStatusChanged", new BuildStatusChangedEvent
        {
            BuildId = id,
            OldStatus = oldStatus,
            NewStatus = status,
            Timestamp = DateTime.UtcNow
        });

        return build;
    }

    [GraphQLField]
    public async Task<Part> AddPart(
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

    [GraphQLField]
    public async Task<TestRun> SubmitTestRun(
        Guid buildId,
        TestStatus status,
        string? result,
        string? fileUrl,
        [Service] FactoryDbContext dbContext,
        [Service] ITopicEventSender eventSender)
    {
        if (string.IsNullOrWhiteSpace(result) && status == TestStatus.Failed)
            throw new GraphQLException("Result is required for failed tests");

        if (fileUrl?.Length > 500)
            throw new GraphQLException("FileUrl must be <= 500 characters");

        var build = await dbContext.Builds.FindAsync(buildId)
            ?? throw new GraphQLException($"Build {buildId} not found");

        using var transaction = await dbContext.Database.BeginTransactionAsync();
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

            dbContext.TestRuns.Add(testRun);
            await dbContext.SaveChangesAsync();

            await transaction.CommitAsync();

            await eventSender.SendAsync("testRunCompleted", new TestRunCompletedEvent
            {
                TestRunId = testRun.Id,
                BuildId = buildId,
                Status = status,
                Timestamp = DateTime.UtcNow
            });

            return testRun;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
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
