using HotChocolate.Language;
using Microsoft.Extensions.Options;

namespace FactoryApp.WebApi.GraphQL;

public class FieldCostCalculator
{
    private readonly QueryComplexityOptions _options;

    public FieldCostCalculator(QueryComplexityOptions options)
    {
        _options = options;
    }

    public int CalculateComplexity(SelectionSetNode? selectionSet)
    {
        if (selectionSet is null)
            return 0;

        int totalCost = 0;

        foreach (var selection in selectionSet.Selections)
        {
            if (selection is FieldNode field)
            {
                // Only count fields that have a selection set (non-leaf fields)
                if (field.SelectionSet is null)
                    continue;

                int fieldCost = GetFieldCost(field.Name.Value);
                int nestedCost = CalculateComplexity(field.SelectionSet);

                // Only apply multiplier if field has explicit limit argument
                if (HasLimitArgument(field))
                {
                    int multiplier = GetListMultiplier(field);
                    totalCost += (fieldCost + nestedCost) * multiplier;
                }
                else
                {
                    totalCost += fieldCost + nestedCost;
                }
            }
        }

        return totalCost;
    }

    public bool IsOverBudget(SelectionSetNode? selectionSet)
    {
        return CalculateComplexity(selectionSet) > _options.MaxComplexity;
    }

    private int GetFieldCost(string fieldName)
    {
        if (_options.FieldCosts.TryGetValue($"Query.{fieldName}", out var cost))
            return cost;
        if (_options.FieldCosts.TryGetValue($"Mutation.{fieldName}", out cost))
            return cost;
        if (_options.FieldCosts.TryGetValue(fieldName, out cost))
            return cost;

        return _options.DefaultFieldCost;
    }

    private bool HasLimitArgument(FieldNode field)
    {
        return field.Arguments.Any(arg => arg.Name.Value == "limit");
    }

    private int GetListMultiplier(FieldNode field)
    {
        foreach (var arg in field.Arguments)
        {
            if (arg.Name.Value == "limit" && arg.Value is IntValueNode intValue)
            {
                if (int.TryParse(intValue.Value, out var limit))
                    return Math.Min(limit, _options.ListMultiplier);
            }
        }

        return _options.ListMultiplier;
    }
}
