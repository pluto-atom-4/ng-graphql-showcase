using HotChocolate.Language;
using Microsoft.Extensions.Options;

namespace FactoryApp.WebApi.GraphQL;

public class QueryComplexityValidator
{
    private readonly FieldCostCalculator _calculator;
    private readonly QueryComplexityOptions _options;

    public QueryComplexityValidator(
        FieldCostCalculator calculator,
        IOptions<QueryComplexityOptions> options)
    {
        _calculator = calculator;
        _options = options.Value;
    }

    public (bool IsValid, int Complexity, string? ErrorMessage) ValidateQuery(DocumentNode? document)
    {
        if (!_options.Enabled || document is null)
            return (true, 0, null);

        var definition = document.Definitions.OfType<OperationDefinitionNode>().FirstOrDefault();

        if (definition?.SelectionSet is null)
            return (true, 0, null);

        int complexity = _calculator.CalculateComplexity(definition.SelectionSet);

        if (complexity > _options.MaxComplexity)
        {
            return (false, complexity,
                $"Query complexity {complexity} exceeds maximum allowed {_options.MaxComplexity}");
        }

        return (true, complexity, null);
    }
}
