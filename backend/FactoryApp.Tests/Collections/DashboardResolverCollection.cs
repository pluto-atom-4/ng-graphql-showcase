using Xunit;

namespace FactoryApp.Tests.Collections;

[CollectionDefinition("Dashboard Resolver Collection", DisableParallelization = true)]
public class DashboardResolverCollection
{
    // This class has no code, just defines the collection
    // Ensures all DashboardResolverTests run sequentially
    // Each test still gets its own TestDatabaseFixture instance for isolation
}
