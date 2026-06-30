using System.Collections.Concurrent;

namespace FactoryApp.GraphQL.Services;

/// <summary>
/// Rate limiter for GraphQL subscription events.
/// Prevents event flooding and resource exhaustion.
/// </summary>
public class SubscriptionRateLimiter
{
    private readonly ConcurrentDictionary<string, InternalSubscriptionStats> _stats =
        new ConcurrentDictionary<string, InternalSubscriptionStats>();

    // Configuration
    private readonly int _maxEventsPerSecond = 100;
    private readonly int _maxConcurrentSubscribers = 1000;
    private readonly TimeSpan _statsWindow = TimeSpan.FromSeconds(1);

    /// <summary>
    /// Check if event should be rate-limited.
    /// Returns false if event exceeds limits.
    /// </summary>
    public bool AllowEvent(string topicId)
    {
        var stats = _stats.AddOrUpdate(
            topicId,
            _ => new InternalSubscriptionStats(),
            (_, existing) => {
                // Reset stats if window expired
                if (DateTime.UtcNow - existing.WindowStart > _statsWindow)
                {
                    return new InternalSubscriptionStats();
                }
                return existing;
            }
        );

        // Increment event count
        var eventCount = Interlocked.Increment(ref stats.EventCount);

        // Check rate limit
        return eventCount <= _maxEventsPerSecond;
    }

    /// <summary>
    /// Register new subscription (track subscriber count).
    /// </summary>
    public bool RegisterSubscriber(string topicId)
    {
        var stats = _stats.AddOrUpdate(
            topicId,
            _ => new InternalSubscriptionStats { SubscriberCount = 1 },
            (_, existing) => {
                existing.SubscriberCount = Interlocked.Increment(ref existing.SubscriberCount);
                return existing;
            }
        );

        return stats.SubscriberCount <= _maxConcurrentSubscribers;
    }

    /// <summary>
    /// Unregister subscription (decrement subscriber count).
    /// </summary>
    public void UnregisterSubscriber(string topicId)
    {
        if (_stats.TryGetValue(topicId, out var stats))
        {
            var count = Interlocked.Decrement(ref stats.SubscriberCount);
            if (count == 0)
            {
                _stats.TryRemove(topicId, out _);
            }
        }
    }

    /// <summary>
    /// Get current stats for monitoring.
    /// </summary>
    public SubscriptionStats? GetStats(string topicId)
    {
        if (_stats.TryGetValue(topicId, out var internalStats))
        {
            return new SubscriptionStats
            {
                EventCount = internalStats.EventCount,
                SubscriberCount = internalStats.SubscriberCount,
                WindowStart = internalStats.WindowStart
            };
        }
        return null;
    }

    private class InternalSubscriptionStats
    {
        public DateTime WindowStart = DateTime.UtcNow;
        public int EventCount;
        public int SubscriberCount;
    }
}

/// <summary>
/// Public stats for subscription monitoring and diagnostics.
/// </summary>
public class SubscriptionStats
{
    public int EventCount { get; set; }
    public int SubscriberCount { get; set; }
    public DateTime WindowStart { get; set; } = DateTime.UtcNow;
}
