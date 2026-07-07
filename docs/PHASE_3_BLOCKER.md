# Phase 3-6 Implementation Blocker: Elsa v3.6+

**Status:** ⏳ BLOCKED  
**Date:** 2026-07-06  
**Affected Issues:** #169, #170, #171, #172 (Phases 3-6)

## Summary

Phase 3 (BuildProcessWorkflow Definition) and subsequent phases (4-6) require Elsa v3.6+ APIs that are not available in current version v3.5.3.

## Missing APIs

### Elsa v3.5.3 Limitations

| Feature                                                   | Required For                               | Status               |
| --------------------------------------------------------- | ------------------------------------------ | -------------------- |
| `WorkflowBase` abstract class                             | Workflow definition fluent builder         | ❌ Not in v3.5.3     |
| `protected override void Build(IWorkflowBuilder builder)` | Workflow composition                       | ❌ Not in v3.5.3     |
| `Name`, `DisplayName`, `Version` override properties      | Workflow metadata                          | ❌ Not in v3.5.3     |
| Async bookmarks                                           | `AwaitTestCompletionActivity` pause/resume | ❌ Not in v3.5.3     |
| `IWorkflowBuilder` fluent API                             | Activity chaining with `Input<T>`          | ❌ Limited in v3.5.3 |

## Current State

- ✅ **Phase 1-2 Complete:** Activities implemented + DI registered (Elsa v3.5.3 compatible)
- ❌ **Phase 3 Blocked:** Fluent workflow builder requires v3.6+
- ❌ **Phase 4-6 Blocked:** Depend on Phase 3

## Workaround (Not Recommended)

Current codebase uses manual activity orchestration via `BuildProcessWorkflowOrchestrator` (Phase 2 approach). This is a workaround for v3.5.3 limitations, but:

- Doesn't use Elsa's workflow runtime (just manual orchestration)
- No async bookmarks (can't pause workflows)
- No persistence layer
- Not production-ready for long-running workflows

## Upgrade Path

### 1. Check Elsa v3.6+ Availability

```bash
# Check NuGet for Elsa 3.6.0 or later
dotnet package search Elsa --exact-match
```

### 2. Update Dependencies

```xml
<!-- File: backend/src/FactoryApp.Workflows/FactoryApp.Workflows.csproj -->
<PackageReference Include="Elsa" Version="3.6.0" />
<PackageReference Include="Elsa.EntityFrameworkCore.SqlServer" Version="3.6.0" />
```

### 3. Implement Phase 3

When v3.6+ available:

```bash
# 1. Update csproj to Elsa 3.6+
# 2. Implement BuildProcessWorkflow.cs with fluent API
# 3. Run tests: dotnet test backend/FactoryApp.Tests
# 4. Build: dotnet build
# 5. Unblock Phase 4-6
```

## Timeline

- **Now:** Phases 1-2 complete ✅
- **v3.6+ Release:** Implement Phase 3 (2-3 days)
- **Then:** Phases 4-6 (follow-on PRs)

## References

- [Elsa GitHub](https://github.com/elsa-workflows/elsa-core)
- [Elsa NuGet](https://www.nuget.org/packages/Elsa)
- Phase 3 spec: `gh-issue-draft-3.md`
- Parent issue: #149

---

**Action Items:**

1. Monitor Elsa releases for v3.6+ availability
2. When available, trigger Phase 3-6 implementation
3. Update this document with v3.6+ release date
4. Re-activate GitHub issues #169-172
