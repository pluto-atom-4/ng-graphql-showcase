using FactoryApp.Domain.Entities;
using FactoryApp.GraphQL.Services;
using Xunit;

namespace FactoryApp.Tests;

public class ValidationServiceTests
{
    [Fact]
    public void ValidateEmail_WithValidEmail_DoesNotThrow()
    {
        // Act & Assert - no exception
        ValidationService.ValidateEmail("test@example.com");
    }

    [Fact]
    public void ValidateEmail_WithEmptyEmail_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidateEmail(""));
    }

    [Fact]
    public void ValidateEmail_WithInvalidFormat_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidateEmail("not-an-email"));
    }

    [Fact]
    public void ValidatePassword_WithValidPassword_DoesNotThrow()
    {
        // Act & Assert - no exception
        ValidationService.ValidatePassword("SecurePassword123!");
    }

    [Fact]
    public void ValidatePassword_WithShortPassword_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidatePassword("Short1!"));
    }

    [Fact]
    public void ValidatePassword_WithEmptyPassword_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidatePassword(""));
    }

    [Fact]
    public void ValidateBuildName_WithValidName_DoesNotThrow()
    {
        // Act & Assert - no exception
        ValidationService.ValidateBuildName("Valid Build Name");
    }

    [Fact]
    public void ValidateBuildName_WithEmptyName_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidateBuildName(""));
    }

    [Fact]
    public void ValidateBuildName_WithNameTooLong_ThrowsException()
    {
        // Arrange
        var longName = new string('a', 257);

        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidateBuildName(longName));
    }

    [Fact]
    public void ValidateBuildDescription_WithValidDescription_DoesNotThrow()
    {
        // Act & Assert - no exception
        ValidationService.ValidateBuildDescription("Valid description");
    }

    [Fact]
    public void ValidateBuildDescription_WithNull_DoesNotThrow()
    {
        // Act & Assert - no exception
        ValidationService.ValidateBuildDescription(null);
    }

    [Fact]
    public void ValidateBuildDescription_WithDescriptionTooLong_ThrowsException()
    {
        // Arrange
        var longDescription = new string('a', 1001);

        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidateBuildDescription(longDescription));
    }

    [Fact]
    public void ValidatePartName_WithValidName_DoesNotThrow()
    {
        // Act & Assert - no exception
        ValidationService.ValidatePartName("Valid Part Name");
    }

    [Fact]
    public void ValidatePartName_WithEmptyName_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidatePartName(""));
    }

    [Fact]
    public void ValidateSKU_WithValidSKU_DoesNotThrow()
    {
        // Act & Assert - no exception
        ValidationService.ValidateSKU("SKU-12345");
    }

    [Fact]
    public void ValidateSKU_WithEmptySKU_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidateSKU(""));
    }

    [Fact]
    public void ValidateQuantity_WithPositiveQuantity_DoesNotThrow()
    {
        // Act & Assert - no exception
        ValidationService.ValidateQuantity(10);
    }

    [Fact]
    public void ValidateQuantity_WithZeroQuantity_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidateQuantity(0));
    }

    [Fact]
    public void ValidateQuantity_WithNegativeQuantity_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidateQuantity(-5));
    }

    [Fact]
    public void ValidateTestResult_WithValidResult_DoesNotThrow()
    {
        // Act & Assert - no exception
        ValidationService.ValidateTestResult("Test passed successfully", false);
    }

    [Fact]
    public void ValidateTestResult_FailedTestWithoutResult_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidateTestResult(null, true));
    }

    [Fact]
    public void ValidateTestResult_FailedTestWithEmptyResult_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidateTestResult("", true));
    }

    [Fact]
    public void ValidateFileUrl_WithValidUrl_DoesNotThrow()
    {
        // Act & Assert - no exception
        ValidationService.ValidateFileUrl("https://example.com/file.zip");
    }

    [Fact]
    public void ValidateFileUrl_WithNull_DoesNotThrow()
    {
        // Act & Assert - no exception
        ValidationService.ValidateFileUrl(null);
    }

    [Fact]
    public void ValidateFileUrl_WithInvalidUrl_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidateFileUrl("not-a-url"));
    }

    [Fact]
    public void ValidatePaginationParams_WithValidParams_DoesNotThrow()
    {
        // Act & Assert - no exception
        ValidationService.ValidatePaginationParams(10, 0);
    }

    [Fact]
    public void ValidatePaginationParams_WithNegativeLimit_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidatePaginationParams(-1, 0));
    }

    [Fact]
    public void ValidatePaginationParams_WithNegativeOffset_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidatePaginationParams(10, -1));
    }

    [Fact]
    public void ValidatePaginationParams_WithLimitExceedingMax_ThrowsException()
    {
        // Act & Assert
        Assert.Throws<Exception>(() => ValidationService.ValidatePaginationParams(1001, 0));
    }
}
