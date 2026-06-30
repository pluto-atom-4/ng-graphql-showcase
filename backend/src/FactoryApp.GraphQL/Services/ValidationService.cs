using HotChocolate;

namespace FactoryApp.GraphQL.Services;

public static class ValidationService
{
    public static void ValidateEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new GraphQLException("Email is required");

        if (!email.Contains("@"))
            throw new GraphQLException("Email must be valid");

        if (email.Length > 256)
            throw new GraphQLException("Email must be <= 256 characters");
    }

    public static void ValidatePassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new GraphQLException("Password is required");

        if (password.Length < 8)
            throw new GraphQLException("Password must be at least 8 characters");
    }

    public static void ValidateBuildName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new GraphQLException("Name is required and cannot be empty");

        if (name.Length > 256)
            throw new GraphQLException("Name must be <= 256 characters");
    }

    public static void ValidateBuildDescription(string? description)
    {
        if (description?.Length > 1000)
            throw new GraphQLException("Description must be <= 1000 characters");
    }

    public static void ValidatePartName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new GraphQLException("Part name is required");

        if (name.Length > 256)
            throw new GraphQLException("Part name must be <= 256 characters");
    }

    public static void ValidateSKU(string sku)
    {
        if (string.IsNullOrWhiteSpace(sku))
            throw new GraphQLException("SKU is required");

        if (sku.Length > 100)
            throw new GraphQLException("SKU must be <= 100 characters");
    }

    public static void ValidateQuantity(decimal quantity)
    {
        if (quantity <= 0)
            throw new GraphQLException("Quantity must be greater than 0");

        if (quantity > 999999)
            throw new GraphQLException("Quantity must be <= 999999");
    }

    public static void ValidateTestResult(string? result, bool isFailedTest)
    {
        if (isFailedTest && string.IsNullOrWhiteSpace(result))
            throw new GraphQLException("Result is required for failed tests");

        if (result?.Length > 2000)
            throw new GraphQLException("Result must be <= 2000 characters");
    }

    public static void ValidateFileUrl(string? fileUrl)
    {
        if (fileUrl?.Length > 500)
            throw new GraphQLException("FileUrl must be <= 500 characters");

        if (!string.IsNullOrEmpty(fileUrl) && !fileUrl.StartsWith("http"))
            throw new GraphQLException("FileUrl must be a valid URL");
    }

    public static void ValidatePaginationParams(int limit, int offset)
    {
        if (limit <= 0)
            throw new GraphQLException("Limit must be > 0");

        if (limit > 1000)
            throw new GraphQLException("Limit must be <= 1000");

        if (offset < 0)
            throw new GraphQLException("Offset must be >= 0");
    }
}
