namespace FactoryApp.Domain.Entities;

public class Part
{
    public Guid Id { get; set; }
    public Guid BuildId { get; set; }
    public required string Name { get; set; }
    public required string SKU { get; set; }
    public int Quantity { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Build? Build { get; set; }
}
