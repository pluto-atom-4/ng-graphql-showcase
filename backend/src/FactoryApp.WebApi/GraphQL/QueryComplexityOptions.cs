namespace FactoryApp.WebApi.GraphQL;

public class QueryComplexityOptions
{
    public bool Enabled { get; set; } = true;
    public int MaxComplexity { get; set; } = 1000;
    public int DefaultFieldCost { get; set; } = 1;
    public int ListMultiplier { get; set; } = 10;
    public Dictionary<string, int> FieldCosts { get; set; } = new();
}
