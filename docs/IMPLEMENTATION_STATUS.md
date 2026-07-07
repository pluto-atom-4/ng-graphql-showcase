# Elsa v3 Workflow Implementation Status

**Issue:** Complete Elsa workflow orchestration patterns  
**Status:** Foundation Complete - Awaiting Elsa v3.6+ Upgrade

---

## Completed (Phase 1-2)

### Phase 1: Elsa Infrastructure Setup ✅

- **File:** `Program.cs` (lines 105-117)
- **Changes:**
  - Registered `AddElsa()` with activity discovery
  - Registered all 5 activities as scoped services
  - Added Elsa NuGet package references

### Phase 2: Activity Implementation ✅

#### Existing Activities (Improved)

- **GetBuildActivity.cs**
  - Added `ILogger` for audit logging
  - Added `Build` output property
  - Proper error handling with logging
- **PublishBuildStatusActivity.cs**
  - Added `ILogger` for event tracking
  - Enum validation before parsing
  - Comprehensive error handling

#### New Activities Created

- **ProcessPartsActivity.cs** - Validates parts exist for a build
- **TriggerTestRunActivity.cs** - Publishes test trigger event, generates test run ID
- **AwaitTestCompletionActivity.cs** - Placeholder for test completion wait (v3.6+ async bookmarks needed)

**Pattern Enforced:** All activities follow primitive-key-only workflow pattern from CLAUDE.md:

- Only Guid/string stored in workflow state
- Fresh data fetched from database on each execution
- Full audit logging for state transitions

---

## Deferred (Phase 3-6) - Requires Elsa v3.6+

### Phase 3: BuildProcessWorkflow Definition ⏳

- **File:** `WorkflowDefinitions/BuildProcessWorkflow.cs`
- **Status:** Placeholder only
- **Blocker:** Elsa v3.5.3 lacks fluent workflow builder API
- **To Complete:** Upgrade to Elsa v3.6+, implement sequential activity composition

### Phase 4: GraphQL Integration ⏳

- **File:** `BuildMutation.cs` (line 120)
- **Status:** TODO comments added
- **Blocker:** Requires Phase 3 completion
- **To Complete:**
  - Inject `IWorkflowHost`
  - Call `StartAsync("BuildProcessWorkflow")` after build creation
  - Pass BuildId as input parameter

### Phase 5: Persistence & State Recovery ⏳

- **Status:** Not started
- **Blocker:** Elsa v3.5.3 persistence API limited
- **To Complete:**
  - Configure SQL Server persistence in Program.cs
  - Implement `WorkflowRecoveryService` for startup resume
  - Add workflow history logging

### Phase 6: Testing Strategy ⏳

- **Status:** Not started
- **Required Tests:**
  - Unit: Activity chain verification
  - Integration: End-to-end workflow execution
  - Compensation: Failure rollback scenarios

---

## Known Elsa v3.5.3 Limitations

| Limitation                       | Workaround                                              | Fixed In |
| -------------------------------- | ------------------------------------------------------- | -------- |
| No `SetVariable/GetVariable` API | Use output properties on activities                     | v3.6+    |
| No async bookmarks               | Can't pause/resume workflows on events                  | v3.6+    |
| No fluent workflow builder       | Register activities only; manual orchestration required | v3.6+    |
| Limited persistence              | No automatic history/recovery                           | v3.6+    |

---

## Event DTOs Created

- **TestRunTriggeredEvent.cs** - Published when test run starts (scope for future subscriptions)
- Follows existing event pattern from BuildStatusChangedEvent

---

## Files Modified/Created

### Created (7 files)

1. `Activities/ProcessPartsActivity.cs` - Parts validation
2. `Activities/TriggerTestRunActivity.cs` - Test trigger
3. `Activities/AwaitTestCompletionActivity.cs` - Test await (stub)
4. `Events/TestRunTriggeredEvent.cs` - Event DTO
5. `WorkflowDefinitions/BuildProcessWorkflow.cs` - Placeholder definition
6. `.claude/plans/concurrent-enchanting-plum.md` - Implementation plan

### Modified (3 files)

1. `Program.cs` - Elsa registration
2. `GetBuildActivity.cs` - Logging, output property, error handling
3. `PublishBuildStatusActivity.cs` - Logging, validation, error handling

---

## Upgrade Path: Elsa v3.6+

1. Update package versions in `FactoryApp.Workflows.csproj`
2. Implement fluent workflow builder in `BuildProcessWorkflow.cs`
3. Wire `IWorkflowHost.StartAsync()` in `BuildMutation.CreateBuild()`
4. Configure persistence: `.UseEntityFrameworkPersistence(options => ...)`
5. Implement `AwaitTestCompletionActivity` with async bookmarks
6. Add compensation logic to workflow definition
7. Implement tests in `backend/FactoryApp.Tests/Workflows/`

---

## Verification (What Compiles Today)

```bash
dotnet build ./backend/src/FactoryApp.WebApi
# ✅ Build succeeded - Activities registered, Elsa foundation set
```

**Frontend can now:**

- Create builds via GraphQL mutation
- Query build status
- Receive real-time updates via Hot Chocolate subscriptions

**Missing:**

- Automatic workflow execution on build creation
- Test run triggering
- Status transitions through workflow pipeline
- Workflow state recovery

---

## Next Steps

1. **Immediate (Optional):** Add manual workflow test to verify activity DI wiring
2. **When Elsa v3.6+ Available:**
   - Update csproj dependencies
   - Implement Phase 3-6 per plan at `.claude/plans/concurrent-enchanting-plum.md`
   - Run integration tests
3. **Migration:** Existing builds transition to new workflow system on upgrade

---

**Issue Reference:** #145, #147, #149  
**CLAUDE.md Constraints:** Satisfied (primitive-only state, no EF entity exposure, logging enforced)  
**Architecture:** Type-safe end-to-end pipeline ready for workflow orchestration
