using FactoryApp.WebApi.GraphQL;
using HotChocolate.Language;
using Microsoft.Extensions.Options;
using Xunit;

namespace FactoryApp.Tests.GraphQL;

public class QueryComplexityValidatorTests
{
    private readonly QueryComplexityValidator _validator;
    private readonly FieldCostCalculator _calculator;
    private readonly QueryComplexityOptions _options;

    public QueryComplexityValidatorTests()
    {
        _options = new QueryComplexityOptions
        {
            Enabled = true,
            MaxComplexity = 100,
            DefaultFieldCost = 1,
            ListMultiplier = 10,
            FieldCosts = new Dictionary<string, int>
            {
                { "Query.builds", 50 },
                { "Query.buildsPaginated", 10 }
            }
        };
        _calculator = new FieldCostCalculator(_options);
        _validator = new QueryComplexityValidator(_calculator, Options.Create(_options));
    }

    [Fact]
    public void ValidateQuery_Disabled_ReturnsValid()
    {
        var disabledOptions = new QueryComplexityOptions { Enabled = false };
        var validator = new QueryComplexityValidator(_calculator, Options.Create(disabledOptions));

        var query = "{ builds { id } }";
        var document = Utf8GraphQLParser.Parse(query);

        var (isValid, complexity, error) = validator.ValidateQuery(document);

        Assert.True(isValid);
        Assert.Null(error);
    }

    [Fact]
    public void ValidateQuery_NullDocument_ReturnsValid()
    {
        var (isValid, complexity, error) = _validator.ValidateQuery(null);

        Assert.True(isValid);
        Assert.Null(error);
    }

    [Fact]
    public void ValidateQuery_WithinLimit_ReturnsValid()
    {
        var query = "{ builds { id } }";
        var document = Utf8GraphQLParser.Parse(query);

        var (isValid, complexity, error) = _validator.ValidateQuery(document);

        Assert.True(isValid);
        Assert.Equal(50, complexity);
        Assert.Null(error);
    }

    [Fact]
    public void ValidateQuery_ExceedsLimit_ReturnsInvalid()
    {
        var query = "{ builds(limit: 3) { id } }";
        var document = Utf8GraphQLParser.Parse(query);

        var (isValid, complexity, error) = _validator.ValidateQuery(document);

        Assert.False(isValid);
        Assert.NotNull(error);
        Assert.Contains("complexity", error, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("150", error); // 50 * 3 = 150, exceeds 100 limit
    }

    [Fact]
    public void ValidateQuery_MultipleRootFields_SumsComplexity()
    {
        var query = "{ builds { id } buildsPaginated { totalCount } }";
        var document = Utf8GraphQLParser.Parse(query);

        var (isValid, complexity, error) = _validator.ValidateQuery(document);

        // 50 (builds) + 10 (buildsPaginated) = 60, within limit of 100
        Assert.True(isValid);
        Assert.Equal(60, complexity);
    }

    [Fact]
    public void ValidateQuery_HighComplexityWithLimit_RejectsQuery()
    {
        var query = "{ builds(limit: 2) { id } buildsPaginated { totalCount } }";
        var document = Utf8GraphQLParser.Parse(query);

        var (isValid, complexity, error) = _validator.ValidateQuery(document);

        // (50 * 2) + 10 = 110, exceeds limit of 100
        Assert.False(isValid);
        Assert.NotNull(error);
    }
}
