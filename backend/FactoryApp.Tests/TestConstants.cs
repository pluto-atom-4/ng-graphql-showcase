namespace FactoryApp.Tests;

public static class TestConstants
{
    public const string TestConnectionString =
        "Server=localhost,1433;Database=FactoryAppDb_Test;User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=true;";

    public const int WorkflowTimeoutSeconds = 30;
    public const int MaxConcurrentWorkflows = 1000;
    public const int WorkflowMaxActivityExecutionSeconds = 5;
}
