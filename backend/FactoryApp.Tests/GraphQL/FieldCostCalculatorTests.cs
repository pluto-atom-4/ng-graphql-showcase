using FactoryApp.WebApi.GraphQL;
using HotChocolate.Language;
using Xunit;

namespace FactoryApp.Tests.GraphQL;

public class FieldCostCalculatorTests
{
    private readonly FieldCostCalculator _calculator;
    private readonly QueryComplexityOptions _options;

    public FieldCostCalculatorTests()
    {
        _options = new QueryComplexityOptions
        {
            Enabled = true,
            MaxComplexity = 1000,
            DefaultFieldCost = 1,
            ListMultiplier = 10,
            FieldCosts = new Dictionary<string, int>
            {
                { "Query.builds", 100 },
                { "Build.parts", 10 },
                { "Build.testRuns", 10 },
                { "Part.testRuns", 5 }
            }
        };
        _calculator = new FieldCostCalculator(_options);
    }

    [Fact]
    public void CalculateComplexity_NullSelectionSet_ReturnsZero()
    {
        var result = _calculator.CalculateComplexity(null);
        Assert.Equal(0, result);
    }

    [Fact]
    public void CalculateComplexity_SingleField_ReturnsFieldCost()
    {
        var query = "{ builds { id } }";
        var document = Utf8GraphQLParser.Parse(query);
        var operation = document.Definitions.OfType<OperationDefinitionNode>().First();

        var result = _calculator.CalculateComplexity(operation.SelectionSet);

        // Query.builds = 100, id is a leaf field so costs 0
        Assert.Equal(100, result);
    }

    [Fact]
    public void CalculateComplexity_NestedFields_SumsComplexity()
    {
        var query = "{ builds { id parts { id } } }";
        var document = Utf8GraphQLParser.Parse(query);
        var operation = document.Definitions.OfType<OperationDefinitionNode>().First();

        var result = _calculator.CalculateComplexity(operation.SelectionSet);

        // Query.builds (100) + nested parts (default 1, no Build context) = 101
        // Note: Without schema info, can't determine nested field types
        Assert.Equal(101, result);
    }

    [Fact]
    public void CalculateComplexity_MultipleRootFields_SumsComplexity()
    {
        var query = "{ builds { id } buildsPaginated(limit: 10, offset: 0) { totalCount } }";
        var document = Utf8GraphQLParser.Parse(query);
        var operation = document.Definitions.OfType<OperationDefinitionNode>().First();

        var result = _calculator.CalculateComplexity(operation.SelectionSet);

        // Query.builds (100) + Query.buildsPaginated with limit multiplier (1 * 10) = 110
        Assert.Equal(110, result);
    }

    [Fact]
    public void CalculateComplexity_WithLimitArgument_AppliesMultiplier()
    {
        var query = "{ builds(limit: 5) { id } }";
        var document = Utf8GraphQLParser.Parse(query);
        var operation = document.Definitions.OfType<OperationDefinitionNode>().First();

        var result = _calculator.CalculateComplexity(operation.SelectionSet);

        // Query.builds (100) * limit multiplier (5) = 500
        Assert.Equal(500, result);
    }

    [Fact]
    public void IsOverBudget_ComplexityWithinLimit_ReturnsFalse()
    {
        var query = "{ builds { id } }";
        var document = Utf8GraphQLParser.Parse(query);
        var operation = document.Definitions.OfType<OperationDefinitionNode>().First();

        var result = _calculator.IsOverBudget(operation.SelectionSet);

        Assert.False(result);
    }

    [Fact]
    public void IsOverBudget_ComplexityExceedsLimit_ReturnsTrue()
    {
        var testCalc = new FieldCostCalculator(new QueryComplexityOptions
        {
            Enabled = true,
            MaxComplexity = 50,
            DefaultFieldCost = 1,
            ListMultiplier = 10,
            FieldCosts = new Dictionary<string, int> { { "Query.builds", 100 } }
        });

        var query = "{ builds { id } }";
        var document = Utf8GraphQLParser.Parse(query);
        var operation = document.Definitions.OfType<OperationDefinitionNode>().First();

        var result = testCalc.IsOverBudget(operation.SelectionSet);

        Assert.True(result);
    }

    [Fact]
    public void CalculateComplexity_DeeplyNestedQuery_CalculatesRecursive()
    {
        var query = @"
        {
            builds {
                id
                parts {
                    id
                    testRuns {
                        id
                    }
                }
            }
        }";
        var document = Utf8GraphQLParser.Parse(query);
        var operation = document.Definitions.OfType<OperationDefinitionNode>().First();

        var result = _calculator.CalculateComplexity(operation.SelectionSet);

        // Query.builds (100) + nested parts (1, default) + nested testRuns (1, default) = 102
        // Note: Without schema context, all nested fields use default cost
        Assert.Equal(102, result);
    }
}
