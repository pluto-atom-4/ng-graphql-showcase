namespace FactoryApp.Tests.Fixtures;

/// <summary>
/// Test database fixture without automatic seeding.
/// Use for tests that provide their own test data.
/// </summary>
public class TestDatabaseFixtureNoSeed : TestDatabaseFixture
{
    public TestDatabaseFixtureNoSeed() : base(seedData: false)
    {
    }
}
