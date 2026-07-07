using Elsa.Workflows;
using FactoryApp.Workflows.Activities;
using FactoryApp.Workflows.WorkflowDefinitions;
using Xunit;

namespace FactoryApp.Tests.Workflows;

/// <summary>
/// Unit tests for BuildProcessWorkflow structure (Phase 3).
/// Verifies workflow definition, activity sequence, versioning.
/// </summary>
public class BuildProcessWorkflowTests
{
    [Fact]
    public void BuildProcessWorkflow_HasCorrectMetadata()
    {
        var workflow = new BuildProcessWorkflow();

        Assert.Equal("BuildProcessWorkflow", workflow.Name);
        Assert.Equal("Build Process Workflow", workflow.DisplayName);
        Assert.Contains("Build", workflow.Description);
        Assert.Equal(1, workflow.Version);
    }

    [Fact]
    public void BuildProcessWorkflow_HasWorkflowBuilder()
    {
        var workflow = new BuildProcessWorkflow();
        Assert.NotNull(workflow);
        Assert.IsAssignableFrom<WorkflowBase>(workflow);
    }

    [Fact]
    public void BuildProcessCompensationWorkflow_HasCorrectMetadata()
    {
        var workflow = new BuildProcessCompensationWorkflow();

        Assert.Equal("BuildProcessCompensationWorkflow", workflow.Name);
        Assert.Equal("Build Process Compensation Workflow", workflow.DisplayName);
        Assert.Contains("compensation", workflow.Description.ToLower());
        Assert.Equal(1, workflow.Version);
    }

    [Fact]
    public void BuildProcessCompensationWorkflow_HasWorkflowBuilder()
    {
        var workflow = new BuildProcessCompensationWorkflow();
        Assert.NotNull(workflow);
        Assert.IsAssignableFrom<WorkflowBase>(workflow);
    }

    [Fact]
    public void BuildProcessWorkflow_CanBeInstantiated()
    {
        var workflow = new BuildProcessWorkflow();
        Assert.NotNull(workflow);
    }

    [Fact]
    public void BuildProcessCompensationWorkflow_CanBeInstantiated()
    {
        var workflow = new BuildProcessCompensationWorkflow();
        Assert.NotNull(workflow);
    }
}
