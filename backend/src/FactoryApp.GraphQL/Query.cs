namespace FactoryApp.GraphQL;

public class Query
{
    public string Hello(string name = "World") => $"Hello {name}!";
}
