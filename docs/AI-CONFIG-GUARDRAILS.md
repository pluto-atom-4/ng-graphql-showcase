# AI Configuration Guardrails & Enforcement

**Document Version:** 1.0.0 | Last Updated: 2026-07-19  
**Scope:** Guardrails defined in CLAUDE.md, AGENTS.md, and rules files  
**Enforcement Owner:** Automated (CI/CD) + Manual (code review)

---

## Overview

This document maps every guardrail rule from config files to actual enforcement mechanisms. Rules without enforcement are aspirational and require manual verification.

**Three enforcement levels:**

- 🔴 **Hard Fail (CI Blocks)** — Automated check blocks PR merge
- 🟡 **Warning (CI Warns)** — Automated check flags issue; PR can merge with review
- 🟢 **Soft Check (Manual Review)** — Code review checklist; no automation (yet)

---

## Guardrails by Domain

### 1. GraphQL Type Safety

#### Rule: "Never edit graphql.ts manually"

**Location:** CLAUDE.md:18, AGENTS.md:75

**Intent:** `graphql.ts` is auto-generated from schema.graphql. Manual edits will be overwritten.

| Aspect        | Enforcement                               | Level     | Status             |
| ------------- | ----------------------------------------- | --------- | ------------------ |
| Detection     | Detect .ts edits post-codegen             | 🔴 Hard   | ⚠️ Not implemented |
| Prevention    | Pre-commit hook blocks `graphql.ts` edits | 🔴 Hard   | ⚠️ Not implemented |
| Documentation | CLAUDE.md:18 + example                    | 🟢 Manual | ✅ Present         |

**Correct Pattern:**

```bash
# After backend schema changes:
dotnet build backend/FactoryApp.slnx        # Auto-emits schema.graphql
pnpm codegen                                # Regenerates graphql.ts
# ✅ graphql.ts updated automatically
```

**Incorrect Pattern:**

```typescript
// ❌ NEVER DO THIS
// Manually editing frontend/src/app/api/generated/graphql.ts
export interface Build {
  id: string;
  status: string;
  // Manual edits here will be lost on next codegen
}
```

**Implementation Path:**

- Phase 5 task: Create pre-commit hook to block `graphql.ts` edits
- Add CI check: Verify `graphql.ts` matches output of `pnpm codegen` in main branch

---

#### Rule: "Never return raw EF Core entities in GraphQL"

**Location:** CLAUDE.md:15, AGENTS.md:78, graphql-patterns.md

**Intent:** Exposing entities couples schema to database design. Use DTOs for decoupling.

| Aspect     | Enforcement                           | Level     | Status        |
| ---------- | ------------------------------------- | --------- | ------------- |
| Detection  | Code review + linter rule             | 🟢 Manual | ✅ Process    |
| Prevention | Architecture pattern in docs          | 🟢 Manual | ✅ Documented |
| Testing    | Test resolver returns DTO, not entity | 🟢 Manual | ✅ Guidance   |

**Correct Pattern:**

```csharp
// ✅ GraphQL returns DTO
public class BuildResolver
{
    [GraphQLType]
    public async Task<BuildDto> GetBuild(Guid id)
    {
        var entity = await _context.Builds.FindAsync(id);
        return _mapper.Map<BuildDto>(entity);
    }
}

public class BuildDto
{
    public Guid Id { get; set; }
    public string Status { get; set; }
    // Minimal schema exposure
}
```

**Incorrect Pattern:**

```csharp
// ❌ Exposing entity directly
public class BuildResolver
{
    public async Task<Build> GetBuild(Guid id)
    {
        return await _context.Builds.FindAsync(id);
        // ❌ Exposes navigation properties, internal state
    }
}
```

**Enforcement:**

- Code review checklist: Verify resolver returns DTO
- Documentation: graphql-patterns.md explains pattern
- Test: Check resolver tests expect DTOs

---

#### Rule: "GraphQL queries max 5 layers deep"

**Location:** CLAUDE.md:20, DESIGN.md:57, graphql-patterns.md

**Intent:** Deep nesting causes N+1 queries. Split into separate requests.

| Aspect     | Enforcement                    | Level      | Status             |
| ---------- | ------------------------------ | ---------- | ------------------ |
| Detection  | Query depth analyzer (missing) | 🟡 Warning | ⚠️ Not implemented |
| Prevention | Documentation + example        | 🟢 Manual  | ✅ Documented      |
| Testing    | Performance regression tests   | 🟢 Manual  | ✅ Guidance        |

**Correct Pattern:**

```graphql
# ✅ Two separate requests
query GetBuild($id: String!) {
  build(id: $id) {
    id
    status
    parts {
      id
      name
    }
  }
}

query GetTestRuns($buildId: String!) {
  testRuns(buildId: $buildId) {
    id
    status
    results {
      id
      passed
    }
  }
}
```

**Incorrect Pattern:**

```graphql
# ❌ 6 layers deep: build → parts → testRuns → results → measurements → values
query {
  build {
    parts {
      testRuns {
        results {
          measurements {
            values
          }
        }
      }
    }
  }
}
```

**Enforcement:**

- Code review: Check query depth manually
- Guidance: graphql-patterns.md section 1
- Future: Implement query-depth analyzer in CI

---

### 2. Database & Transactions

#### Rule: "EF Core + Dapper must share explicit DbTransaction"

**Location:** CLAUDE.md:16, AGENTS.md:58, database-rules.md

**Intent:** Without shared transaction, deadlocks occur on factory floor (real incident).

| Aspect        | Enforcement                     | Level     | Status      |
| ------------- | ------------------------------- | --------- | ----------- |
| Detection     | Code review + test verification | 🟢 Manual | ✅ Active   |
| Prevention    | Integration tests with real DB  | 🟢 Manual | ✅ Required |
| Documentation | database-rules.md + example     | 🟢 Manual | ✅ Detailed |

**Correct Pattern:**

```csharp
// ✅ Shared transaction
using var transaction = await context.Database.BeginTransactionAsync();
try
{
    // EF Core operations
    var build = await context.Builds.FindAsync(buildId);
    build.Status = BuildStatus.Complete;
    await context.SaveChangesAsync();

    // Dapper operations (same transaction)
    var dbTransaction = context.Database.CurrentTransaction?.GetDbTransaction();
    await connection.ExecuteAsync(
        "INSERT INTO TestMetrics (BuildId, Value) VALUES (@BuildId, @Value)",
        new { BuildId = buildId, Value = 42.5 },
        transaction: dbTransaction
    );

    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}
```

**Incorrect Pattern:**

```csharp
// ❌ Separate transactions = deadlock risk
var build = await context.Builds.FindAsync(buildId);
build.Status = BuildStatus.Complete;
await context.SaveChangesAsync();  // Auto-commits

await connection.ExecuteAsync(  // Separate transaction
    "INSERT INTO TestMetrics...",
    new { BuildId = buildId, Value = 42.5 }
);
```

**Enforcement:**

- Code review: Spot-check mutations for shared transaction pattern
- Integration tests: Must use real SQL Server (no mocks)
- Test verification: Run against production schema
- Team incident log: Prior deadlock documented in database-rules.md

---

#### Rule: "Never mock DbContext in tests"

**Location:** CLAUDE.md:17, AGENTS.md:80, database-rules.md

**Intent:** Mocks diverge from production behavior. Past incident: mocked tests passed, prod migration failed.

| Aspect     | Enforcement                      | Level      | Status         |
| ---------- | -------------------------------- | ---------- | -------------- |
| Detection  | Test review + architecture audit | 🟢 Manual  | ✅ Process     |
| Prevention | Guidance doc + test fixtures     | 🟢 Manual  | ✅ Provided    |
| Testing    | Real SQL Server required for CI  | 🟡 Warning | ✅ CI enforces |

**Correct Pattern:**

```csharp
// ✅ Real database
public class BuildRepositoryTests : IAsyncLifetime
{
    private DbContext _context;
    private string _testDbName = $"FactoryAppDb_Test_{Guid.NewGuid()}";

    public async Task InitializeAsync()
    {
        var connectionString = $"Server=localhost,1433;Database={_testDbName};...";
        _context = new FactoryDbContext(connectionString);
        await _context.Database.MigrateAsync();  // Apply migrations to test DB
    }

    [Fact]
    public async Task CreateBuild_ShouldPersist()
    {
        // ✅ Real database behavior
        var build = new Build { /* ... */ };
        _context.Builds.Add(build);
        await _context.SaveChangesAsync();

        var retrieved = await _context.Builds.FindAsync(build.Id);
        Assert.NotNull(retrieved);
    }

    public async Task DisposeAsync()
    {
        await _context.Database.EnsureDeletedAsync();  // Cleanup test DB
    }
}
```

**Incorrect Pattern:**

```csharp
// ❌ Mock DbContext
var mockContext = new Mock<DbContext>();
mockContext.Setup(c => c.Builds)
    .Returns(new List<Build> { /* fake data */ }.AsQueryable());

// Tests pass but prod migrations fail ❌
```

**Enforcement:**

- Code review: Flag any `new Mock<DbContext>()`
- CI prerequisite: Docker SQL Server required for `dotnet test`
- Documentation: database-rules.md explains why + incident context

---

### 3. Frontend Performance

#### Rule: "All *ngFor loops must have trackBy function"

**Location:** CLAUDE.md:21, DESIGN.md:54, frontend-patterns.md

**Intent:** Without trackBy, DOM thrashing on array changes causes jank.

| Aspect     | Enforcement                  | Level      | Status            |
| ---------- | ---------------------------- | ---------- | ----------------- |
| Detection  | Linter rule (eslint/angular) | 🟡 Warning | ⚠️ Not configured |
| Prevention | Component template linting   | 🟢 Manual  | ✅ Guidance       |
| Testing    | Visual regression tests      | 🟢 Manual  | ⚠️ Partial        |

**Correct Pattern:**

```typescript
// Component
export class BuildListComponent {
  builds: Build[] = [];

  trackByBuildId(index: number, build: Build): any {
    return build.id;
  }
}

// Template
@for (build of builds; track trackByBuildId($index, $item)) {
  <app-build-card [build]="build" />
}
```

**Incorrect Pattern:**

```typescript
// ❌ No trackBy = re-init on every change
@for (build of builds) {
  <app-build-card [build]="build" />
}
```

**Enforcement:**

- Code review: Check for @for loops without track
- Guidance: frontend-patterns.md section 1
- Future: Configure ESLint rule to flag missing trackBy

---

#### Rule: "OnPush change detection strategy mandatory"

**Location:** CLAUDE.md (implied), DESIGN.md:54, frontend-patterns.md

**Intent:** OnPush prevents unnecessary change detection cycles on async events.

| Aspect     | Enforcement                                | Level      | Status      |
| ---------- | ------------------------------------------ | ---------- | ----------- |
| Detection  | Code review + linter                       | 🟢 Manual  | ✅ Process  |
| Prevention | Component template lint                    | 🟡 Warning | ⚠️ Partial  |
| Testing    | Change detection audit (DESIGN.md Phase 1) | 🟢 Manual  | ✅ Complete |

**Correct Pattern:**

```typescript
import { ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-build-card",
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ Required
  template: `...`,
})
export class BuildCardComponent {
  @Input() build: Build;
}
```

**Incorrect Pattern:**

```typescript
@Component({
  selector: "app-build-card",
  // ❌ Missing OnPush = change detection on every async event
  template: `...`,
})
export class BuildCardComponent {}
```

**Enforcement:**

- Code review: Verify all components have OnPush
- CI check (Phase 3 audit): Can scan for missing strategy
- Documentation: DESIGN.md explains performance impact

---

### 4. Workflow State Management

#### Rule: "Store only primitives in Elsa workflow variables"

**Location:** CLAUDE.md:19, AGENTS.md:82, workflow-integration.md

**Intent:** Complex objects stale quickly in long-running workflows. Fetch fresh data on activity execution.

| Aspect     | Enforcement                      | Level     | Status      |
| ---------- | -------------------------------- | --------- | ----------- |
| Detection  | Code review + architecture audit | 🟢 Manual | ✅ Process  |
| Prevention | Activity pattern template        | 🟢 Manual | ✅ Provided |
| Testing    | Workflow integration tests       | 🟢 Manual | ✅ Guidance |

**Correct Pattern:**

```csharp
// ✅ Store primitive keys
workflowState.SetVariable("BuildId", buildId);  // Guid primitive

// In activity execution: fetch fresh
public class ProcessBuildActivity : Activity
{
    public async Task ExecuteAsync(ActivityExecutionContext context)
    {
        var buildId = context.GetVariable<Guid>("BuildId");
        var build = await _dbContext.Builds.FindAsync(buildId);  // Fresh data
        // Process with fresh entity
    }
}
```

**Incorrect Pattern:**

```csharp
// ❌ Storing complex object
var build = await context.Builds.FindAsync(buildId);
workflowState.SetVariable("CurrentBuild", build);  // ❌ Stale!

// Later activity:
var build = workflowState.GetVariable<Build>("CurrentBuild");
// build data is hours old ❌
```

**Enforcement:**

- Code review: Check activity implementations
- Documentation: workflow-integration.md explains why + async pattern
- Testing: Workflow tests verify fresh data fetching

---

### 5. Phase-Based Dependencies

#### Rule: "Implement #148 (Auth) before #149 (Workflows)"

**Location:** CLAUDE.md:22-25, AGENTS.md:94

**Intent:** Authorization must be foundation before workflows can securely orchestrate operations.

| Aspect        | Enforcement                            | Level      | Status        |
| ------------- | -------------------------------------- | ---------- | ------------- |
| Detection     | Issue blocking relationships           | 🔴 Hard    | ✅ GitHub     |
| Prevention    | Branch protection + issue workflow     | 🟡 Warning | ✅ Configured |
| Documentation | CLAUDE.md Phase-Based Guardrails table | 🟢 Manual  | ✅ Present    |

**Correct Sequence:**

```
Phase 1 (Frontend #47)          → ✅ COMPLETE
  ↓
Phase 2 (Authorization #148)    → CURRENT
  ↓
Phase 3 (Workflows #149)        → BLOCKED until #148 complete
  ↓
Phase 4 (Rate Limiting #147)    → BLOCKED until #149 complete
```

**Incorrect Sequence:**

```
❌ Starting #149 (Workflows) before #148 (Auth) complete
  → Workflows can't enforce authorization
  → Security gap in orchestration layer
```

**Enforcement:**

- GitHub issue blocking: #149 depends on #148
- Branch protection: Enforce sequential merges
- Documentation: CLAUDE.md table shows full dependency chain
- Team process: Code review checks phase order

---

## Enforcement Summary Table

| Guardrail        | Rule                      | Level      | Mechanism                   | Owner      | Status     |
| ---------------- | ------------------------- | ---------- | --------------------------- | ---------- | ---------- |
| graphql.ts edit  | Never manually edit       | 🔴 Hard    | Pre-commit hook (TODO)      | Automation | ⚠️ Planned |
| Entity exposure  | Return DTOs, not entities | 🟢 Manual  | Code review checklist       | Reviewer   | ✅ Active  |
| Query depth      | Max 5 layers              | 🟡 Warning | Documentation + review      | Reviewer   | ✅ Active  |
| Transactions     | Share DbTransaction       | 🟢 Manual  | Integration tests + review  | Reviewer   | ✅ Active  |
| Mock DbContext   | Never mock DB             | 🟢 Manual  | Real DB requirement         | CI/Review  | ✅ Active  |
| trackBy function | All @for loops            | 🟡 Warning | Linter (TODO)               | Automation | ⚠️ Planned |
| OnPush strategy  | All components            | 🟢 Manual  | Code review + audit         | Reviewer   | ✅ Active  |
| Workflow state   | Primitives only           | 🟢 Manual  | Activity templates + review | Reviewer   | ✅ Active  |
| Phase order      | #148 → #149 → #147        | 🔴 Hard    | GitHub issue blocking       | Bot        | ✅ Active  |

---

## Implementation Checklist

### ✅ Currently Enforced (Passive)

- [x] Entity exposure rule (documented in graphql-patterns.md)
- [x] Query depth rule (documented + example)
- [x] Transaction sharing (documented + incident context)
- [x] No mock DbContext (integration test requirement)
- [x] Workflow primitives rule (documented + pattern)
- [x] Phase-based dependencies (GitHub issue blocking)

### 🟡 Partially Enforced (Manual + Documentation)

- [x] OnPush change detection (code review + DESIGN.md Phase 1 audit complete)
- [x] trackBy function (documented; linter not configured)
- [x] graphql.ts edits (documented; pre-commit hook missing)

### ⚠️ Not Yet Enforced (Planned for Phase 5+)

- [ ] Query depth analyzer (automated check in CI)
- [ ] Pre-commit hook for graphql.ts protection
- [ ] ESLint rule for trackBy in templates
- [ ] GraphQL query analyzer for N+1 detection

---

## Examples by Guardrail

### Example 1: Correct Transaction Handling

**File:** `backend/src/FactoryApp.GraphQL/Mutations/CreateBuildMutation.cs`

```csharp
public class CreateBuildMutation
{
    [GraphQLType]
    public async Task<BuildPayload> CreateBuild(
        string name,
        [Service] IDbContextFactory<FactoryDbContext> contextFactory,
        [Service] IDbConnection connection)
    {
        using var context = await contextFactory.CreateDbContextAsync();
        using var transaction = await context.Database.BeginTransactionAsync();

        try
        {
            // Step 1: Create entity with EF Core
            var build = new Build { Name = name, Status = BuildStatus.Pending };
            context.Builds.Add(build);
            await context.SaveChangesAsync();

            // Step 2: Log telemetry with Dapper (same transaction)
            var dbTransaction = context.Database.CurrentTransaction?.GetDbTransaction();
            await connection.ExecuteAsync(
                "INSERT INTO BuildMetrics (BuildId, EventType, CreatedAt) VALUES (@BuildId, @EventType, @CreatedAt)",
                new { BuildId = build.Id, EventType = "Created", CreatedAt = DateTime.UtcNow },
                transaction: dbTransaction
            );

            await transaction.CommitAsync();

            return new BuildPayload { Build = new BuildDto { Id = build.Id, Name = build.Name } };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
```

**Why:** Both EF Core + Dapper modifications are atomic. No race conditions.

---

### Example 2: Incorrect Query Depth

**File:** `frontend/src/app/services/build.service.ts`

```typescript
// ❌ WRONG: 6 layers deep
const BUILD_QUERY = gql`
  query GetBuildDetails($id: String!) {
    build(id: $id) {
      id
      status
      parts {
        # Layer 2
        id
        testRuns {
          # Layer 3
          id
          results {
            # Layer 4
            id
            measurements {
              # Layer 5
              id
              values {
                # Layer 6 ❌ TOO DEEP
                reading
              }
            }
          }
        }
      }
    }
  }
`;

// ✅ CORRECT: Split into 2 requests
const BUILD_QUERY = gql`
  query GetBuild($id: String!) {
    build(id: $id) {
      id
      status
      parts {
        id
      }
    }
  }
`;

const TEST_RUNS_QUERY = gql`
  query GetTestRuns($buildId: String!) {
    testRuns(buildId: $buildId) {
      id
      status
      results {
        id
        measurements {
          id
          reading
        }
      }
    }
  }
`;

// In component: load sequentially
this.buildService
  .getBuild(id)
  .pipe(
    switchMap((build) => {
      this.build = build;
      return this.buildService.getTestRuns(build.id);
    }),
  )
  .subscribe((testRuns) => (this.testRuns = testRuns));
```

**Why:** Two separate queries prevent N+1 and allow DataLoaders to batch child queries.

---

## Related Documents

- **CLAUDE.md** — Core guardrails (section ⚠️ NEVER DO THIS)
- **AGENTS.md** — Agent guardrails & boundaries
- **docs/DATABASE.md** — Transaction + testing strategy
- **docs/ARCHITECTURE.md** — Type-safety pipeline detail
- **.claude/rules/** — Domain-specific pattern files:
  - `database-rules.md` — Transaction patterns
  - `graphql-patterns.md` — Query depth, entity exposure
  - `backend-patterns.md` — EF Core, DataLoaders
  - `frontend-patterns.md` — Angular, trackBy, OnPush
  - `workflow-integration.md` — Elsa primitives
- **Issue #215** — AI Configuration Maintenance initiative

---

## Maintenance

This document is updated when:

1. **New guardrail added** — Add row to enforcement table + examples
2. **Enforcement mechanism implemented** — Update status column
3. **Guardrail changed/removed** — Update phase tag + rationale
4. **Incident discovered** — Document in example + root cause

**Next review:** Q4 2026 (October 1-15)  
**Last updated:** 2026-07-19  
**Version:** 1.0.0

---

## Appendix: How to Add New Guardrails

1. **Document in CLAUDE.md** under ⚠️ NEVER or ✅ DO section
2. **Add to this file** (AI-CONFIG-GUARDRAILS.md) with:
   - Rule text + intent
   - Enforcement level (Hard/Warning/Soft)
   - Correct + incorrect pattern
   - Owner (automation/reviewer)
3. **Implement enforcement**:
   - Hard: CI/pre-commit hook
   - Warning: CI warning + documentation
   - Soft: Code review checklist
4. **Link from AGENTS.md** if applies to autonomous agents

**Example:**

```markdown
#### Rule: "Never publish secrets in error messages"

**Location:** CLAUDE.md:XX, SECURITY.md:XX

**Intent:** Error messages may be logged/exposed; never include API keys, tokens, credentials.

| Aspect | Enforcement | Level | Status |
| Detection | Secret scanner CI | 🔴 Hard | ✅ Active |
| Prevention | Code review + scan | 🔴 Hard | ✅ Active |
| Documentation | SECURITY.md section X | 🟢 Manual | ✅ Present |
```

---

**Document Owner:** Full-stack engineering team  
**Questions?** Reference Issue #215 or docs/AI-CONFIG-MAINTENANCE.md
