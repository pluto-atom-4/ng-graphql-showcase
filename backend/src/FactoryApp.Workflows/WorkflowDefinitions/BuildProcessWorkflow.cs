namespace FactoryApp.Workflows.WorkflowDefinitions;

/// <summary>
/// BuildProcessWorkflow orchestrates the complete manufacturing build process:
/// Build → Validate Parts → Trigger Tests → Await Test Completion → Publish Status
///
/// This workflow follows the primitive-key-only pattern (workflow-integration.md):
/// - Only BuildId (Guid string) is stored in workflow state
/// - Each activity fetches fresh data from database on execution
/// - Workflow version isolation prevents schema changes from breaking in-flight workflows
///
/// Note: For Elsa v3.5.3, this workflow is orchestrated via C# code in BuildProcessWorkflowOrchestrator.
/// When upgrading to Elsa v3.6+, this can use proper fluent workflow builder API and async bookmarks.
/// </summary>
public class BuildProcessWorkflow
{
    // Placeholder for workflow definition
    // Actual orchestration happens in FactoryApp.WebApi.Services.BuildProcessWorkflowOrchestrator
}
