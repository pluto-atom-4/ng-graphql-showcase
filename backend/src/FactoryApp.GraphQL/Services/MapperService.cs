using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.DTOs;

namespace FactoryApp.GraphQL.Services;

public static class MapperService
{
    public static BuildPayload ToBuildPayload(Build build)
        => new BuildPayload
        {
            Id = build.Id,
            Name = build.Name,
            Description = build.Description,
            Status = build.Status.ToString(),
            CreatedAt = build.CreatedAt,
            UpdatedAt = build.UpdatedAt
        };

    public static PartPayload ToPartPayload(Part part)
        => new PartPayload
        {
            Id = part.Id,
            BuildId = part.BuildId,
            Name = part.Name,
            SKU = part.SKU,
            Quantity = part.Quantity,
            CreatedAt = part.CreatedAt
        };

    public static TestRunPayload ToTestRunPayload(TestRun testRun)
        => new TestRunPayload
        {
            Id = testRun.Id,
            BuildId = testRun.BuildId,
            Status = testRun.Status.ToString(),
            Result = testRun.Result,
            FileUrl = testRun.FileUrl,
            CompletedAt = testRun.CompletedAt,
            CreatedAt = testRun.CreatedAt,
            UpdatedAt = testRun.UpdatedAt
        };
}
