namespace FactoryApp.GraphQL.DTOs;

public class PartPayload
{
    public Guid Id { get; set; }
    public Guid BuildId { get; set; }
    public required string Name { get; set; }
    public required string SKU { get; set; }
    public decimal Quantity { get; set; }
    public DateTime CreatedAt { get; set; }
}
