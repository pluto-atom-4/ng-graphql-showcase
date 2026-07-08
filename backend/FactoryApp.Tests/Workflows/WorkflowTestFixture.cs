using FactoryApp.Domain;
using Moq;
using Xunit;
using Microsoft.EntityFrameworkCore;
using HotChocolate.Subscriptions;

namespace FactoryApp.Tests.Workflows;

public class WorkflowTestFixture : IAsyncLifetime
{
    public FactoryDbContext DbContext { get; private set; } = null!;
    public Mock<ITopicEventSender> MockEventSender { get; private set; } = null!;

    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<FactoryDbContext>()
            .UseSqlServer(TestConstants.TestConnectionString)
            .Options;

        DbContext = new FactoryDbContext(options);
        await DbContext.Database.EnsureCreatedAsync();

        MockEventSender = new Mock<ITopicEventSender>();
    }

    public async Task DisposeAsync()
    {
        await DbContext.Database.EnsureDeletedAsync();
        DbContext.Dispose();
    }
}
