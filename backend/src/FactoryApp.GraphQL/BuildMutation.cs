using FactoryApp.Domain;
using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.DTOs;
using FactoryApp.GraphQL.Events;
using FactoryApp.GraphQL.Services;
using HotChocolate;
using HotChocolate.Subscriptions;
using Microsoft.EntityFrameworkCore;

namespace FactoryApp.GraphQL;

public class BuildMutationType
{
    public async Task<AuthPayload> Login(
        string email,
        string password,
        [Service] FactoryDbContext dbContext,
        [Service] AuthService authService,
        [Service] LoggingService loggingService)
    {
        var args = new Dictionary<string, object?> { { "email", email } };

        try
        {
            loggingService.LogMutationStart(nameof(Login), args);

            try
            {
                ValidationService.ValidateEmail(email);
                ValidationService.ValidatePassword(password);
            }
            catch (GraphQLException validationEx)
            {
                loggingService.LogValidationError(nameof(Login), validationEx.Message);
                throw;
            }

            var user = await dbContext.AuthUsers
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                loggingService.LogAuthenticationAttempt(email, false);
                throw new GraphQLException("Invalid email or password");
            }

            if (!authService.VerifyPassword(password, user.PasswordHash))
            {
                loggingService.LogAuthenticationAttempt(email, false);
                throw new GraphQLException("Invalid email or password");
            }

            var token = authService.GenerateToken(user.Id, user.Email);
            loggingService.LogAuthenticationAttempt(email, true);
            loggingService.LogMutationSuccess(nameof(Login), user.Id);

            return new AuthPayload
            {
                Token = token,
                User = new AuthUserPayload { Id = user.Id, Email = user.Email }
            };
        }
        catch (GraphQLException)
        {
            throw;
        }
        catch (Exception ex)
        {
            loggingService.LogMutationError(nameof(Login), ex, args);
            throw new GraphQLException("Authentication failed", ex);
        }
    }

    public async Task<BuildPayload> CreateBuild(
        string name,
        string? description,
        [Service] FactoryDbContext dbContext,
        [Service] LoggingService loggingService)
    {
        var args = new Dictionary<string, object?> { { "name", name }, { "description", description } };

        try
        {
            loggingService.LogMutationStart(nameof(CreateBuild), args);

            try
            {
                ValidationService.ValidateBuildName(name);
                ValidationService.ValidateBuildDescription(description);
            }
            catch (GraphQLException validationEx)
            {
                loggingService.LogValidationError(nameof(CreateBuild), validationEx.Message);
                throw;
            }

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

            loggingService.LogMutationSuccess(nameof(CreateBuild), build.Id);
            return MapperService.ToBuildPayload(build);
        }
        catch (GraphQLException)
        {
            throw;
        }
        catch (Exception ex)
        {
            loggingService.LogMutationError(nameof(CreateBuild), ex, args);
            loggingService.LogDatabaseError(nameof(CreateBuild), ex);
            throw new GraphQLException("Failed to create build", ex);
        }
    }

    public async Task<BuildPayload> UpdateBuildStatus(
        Guid id,
        BuildStatus status,
        [Service] FactoryDbContext dbContext,
        [Service] ITopicEventSender eventSender,
        [Service] LoggingService loggingService)
    {
        var args = new Dictionary<string, object?> { { "id", id }, { "status", status } };

        try
        {
            loggingService.LogMutationStart(nameof(UpdateBuildStatus), args);

            var build = await dbContext.Builds.FindAsync(id);
            if (build == null)
            {
                loggingService.LogValidationError(nameof(UpdateBuildStatus), $"Build {id} not found");
                throw new GraphQLException($"Build {id} not found");
            }

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

            loggingService.LogMutationSuccess(nameof(UpdateBuildStatus), id);
            return MapperService.ToBuildPayload(build);
        }
        catch (GraphQLException)
        {
            throw;
        }
        catch (Exception ex)
        {
            loggingService.LogMutationError(nameof(UpdateBuildStatus), ex, args);
            loggingService.LogDatabaseError(nameof(UpdateBuildStatus), ex);
            throw new GraphQLException("Failed to update build status", ex);
        }
    }

    public async Task<PartPayload> AddPart(
        Guid buildId,
        string name,
        string sku,
        decimal quantity,
        [Service] FactoryDbContext dbContext,
        [Service] LoggingService loggingService)
    {
        var args = new Dictionary<string, object?>
        {
            { "buildId", buildId },
            { "name", name },
            { "sku", sku },
            { "quantity", quantity }
        };

        try
        {
            loggingService.LogMutationStart(nameof(AddPart), args);

            try
            {
                ValidationService.ValidatePartName(name);
                ValidationService.ValidateSKU(sku);
                ValidationService.ValidateQuantity(quantity);
            }
            catch (GraphQLException validationEx)
            {
                loggingService.LogValidationError(nameof(AddPart), validationEx.Message);
                throw;
            }

            var build = await dbContext.Builds.FindAsync(buildId);
            if (build == null)
            {
                loggingService.LogValidationError(nameof(AddPart), $"Build {buildId} not found");
                throw new GraphQLException($"Build {buildId} not found");
            }

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

            loggingService.LogMutationSuccess(nameof(AddPart), part.Id);
            return MapperService.ToPartPayload(part);
        }
        catch (GraphQLException)
        {
            throw;
        }
        catch (Exception ex)
        {
            loggingService.LogMutationError(nameof(AddPart), ex, args);
            loggingService.LogDatabaseError(nameof(AddPart), ex);
            throw new GraphQLException("Failed to add part", ex);
        }
    }

    public async Task<TestRunPayload> SubmitTestRun(
        Guid buildId,
        TestStatus status,
        string? result,
        string? fileUrl,
        [Service] FactoryDbContext dbContext,
        [Service] ITopicEventSender eventSender,
        [Service] LoggingService loggingService)
    {
        var args = new Dictionary<string, object?>
        {
            { "buildId", buildId },
            { "status", status },
            { "result", result },
            { "fileUrl", fileUrl }
        };

        try
        {
            loggingService.LogMutationStart(nameof(SubmitTestRun), args);

            try
            {
                ValidationService.ValidateTestResult(result, status == TestStatus.Failed);
                ValidationService.ValidateFileUrl(fileUrl);
            }
            catch (GraphQLException validationEx)
            {
                loggingService.LogValidationError(nameof(SubmitTestRun), validationEx.Message);
                throw;
            }

            var build = await dbContext.Builds.FindAsync(buildId);
            if (build == null)
            {
                loggingService.LogValidationError(nameof(SubmitTestRun), $"Build {buildId} not found");
                throw new GraphQLException($"Build {buildId} not found");
            }

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

                loggingService.LogMutationSuccess(nameof(SubmitTestRun), testRun.Id);
                return MapperService.ToTestRunPayload(testRun);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        catch (GraphQLException)
        {
            throw;
        }
        catch (Exception ex)
        {
            loggingService.LogMutationError(nameof(SubmitTestRun), ex, args);
            loggingService.LogDatabaseError(nameof(SubmitTestRun), ex);
            throw new GraphQLException("Failed to submit test run", ex);
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
