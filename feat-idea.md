## write a GitHub Issue and write to ./gh-issue-draft.md

Title: "feat: Workflow visibility on frontend"

Content:

Currently NO dedicated workflow page. Frontend shows:

- Builds list (home) - 44+ builds with status (RUNNING, COMPLETE, FAILED)
- Build details - parts, test runs (click any build)
- Status updates - real-time via GraphQL subscription
- Test runs - PASSED/FAILED results

Workflow content NOT visible yet:

- WorkflowHistory records (service startup, recovery events)
- Workflow execution progress/timeline
- Activity execution details

WorkflowHistory table populated on backend but no frontend component to display it.

Create workflow viewer component
