using Elsa.Workflows;
using FactoryApp.Workflows.Activities;
using FactoryApp.Workflows.WorkflowDefinitions;
using Xunit;

namespace FactoryApp.Tests.Workflows;

/// <summary>
/// Unit tests for BuildProcessWorkflow structure (Phase 3).
/// Verifies workflow inheritance and proper construction.
/// Metadata (Name, Version) handled by workflow registration system.
/// </summary>
public class BuildProcessWorkflowTests
{
    [Fact]
    public void BuildProcessWorkflow_InheritsFromWorkflowBase()
    {
        var workflow = new BuildProcessWorkflow();
        Assert.IsAssignableFrom<WorkflowBase>(workflow);
    }

    [Fact]
    public void BuildProcessWorkflow_CanBeInstantiated()
    {
        var workflow = new BuildProcessWorkflow();
        Assert.NotNull(workflow);
    }

    [Fact]
    public void BuildProcessCompensationWorkflow_InheritsFromWorkflowBase()
    {
        var workflow = new BuildProcessCompensationWorkflow();
        Assert.IsAssignableFrom<WorkflowBase>(workflow);
    }

    [Fact]
    public void BuildProcessCompensationWorkflow_CanBeInstantiated()
    {
        var workflow = new BuildProcessCompensationWorkflow();
        Assert.NotNull(workflow);
    }
}
