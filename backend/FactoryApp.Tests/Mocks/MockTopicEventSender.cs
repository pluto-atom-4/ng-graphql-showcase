using HotChocolate.Subscriptions;

namespace FactoryApp.Tests.Mocks;

public class MockTopicEventSender : ITopicEventSender
{
    public bool FailOnSend { get; set; }
    public List<(string Topic, object Message)> SentMessages { get; } = new();

    public ValueTask SendAsync<TMessage>(string topicName, TMessage message, CancellationToken cancellationToken = default)
    {
        if (FailOnSend)
            throw new InvalidOperationException("Mock event sender configured to fail");

        SentMessages.Add((topicName, message!));
        return ValueTask.CompletedTask;
    }

    public ValueTask CompleteAsync(string topicName)
    {
        return ValueTask.CompletedTask;
    }
}
