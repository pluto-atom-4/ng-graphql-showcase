namespace FactoryApp.GraphQL.DTOs;

public class TestRunPayload
{
    public Guid Id { get; set; }
    public Guid BuildId { get; set; }
    public string Status { get; set; } = null!;
    public string? Result { get; set; }
    public string? FileUrl { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
