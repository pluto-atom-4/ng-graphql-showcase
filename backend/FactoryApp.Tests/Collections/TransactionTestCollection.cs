using FactoryApp.Tests.Fixtures;

namespace FactoryApp.Tests.Collections;

[CollectionDefinition("SQL Server Transaction Tests")]
public class TransactionTestCollection : ICollectionFixture<TestDatabaseFixture>
{
    // Prevents parallel test execution
    // Avoids SQL Server connection pool exhaustion
}
