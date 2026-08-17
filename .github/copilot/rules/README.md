# Copilot Path-Specific Architecture Rules

**Version:** 1.0.0 | **Last Updated:** 2026-08-16

Domain-specific rules for GitHub Copilot and Claude Code. Rules auto-append to context when file paths match `applies_to:` glob patterns.

---

## Rule Files

| Rule File                   | Domain                        | Applies To                                                                                                      | Priority |
| --------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| `backend-patterns.md`       | ASP.NET Core .NET 10          | `backend/src/**/*.cs`, `backend/**/*.csproj`                                                                    | High     |
| `frontend-patterns.md`      | Angular 19+                   | `frontend/src/**/*.ts`, `frontend/src/**/*.html`                                                                | High     |
| `database-rules.md`         | EF Core + Dapper + SQL Server | `backend/**/*Migration*.cs`, `**/*.sql`, `**/*DbContext*.cs`                                                    | High     |
| `graphql-patterns.md`       | Hot Chocolate GraphQL         | `**/*.graphql`, `backend/src/**/*Query*.cs`, `backend/src/**/*Mutation*.cs`, `backend/src/**/*Subscription*.cs` | High     |
| `accessibility-patterns.md` | WCAG 2.1 Level AA             | `frontend/src/**/*.ts`, `frontend/src/**/*.html`                                                                | Medium   |
| `workflow-integration.md`   | Elsa v3.5.3 Workflows         | `backend/src/**/*Workflow*.cs`, `backend/src/**/Activities/**/*.cs`                                             | Medium   |

---

## Rule Precedence (If Multiple Rules Match)

When a file edit matches multiple rule glob patterns, precedence is:

1. **Priority**: Rules marked `priority: high` load before `priority: medium`
2. **Specificity**: More specific glob patterns win
   - `backend/src/**/*.cs` (specific) beats `backend/**/*.cs` (broad)
   - `backend/src/FactoryApp.WebApi/Query.cs` matches most specific rule for that file
3. **Order**: First match wins (rules evaluated top-to-bottom in this README)

### Example: Editing `backend/src/FactoryApp.WebApi/Migrations/AddBuildHistory.cs`

```
Matching rules:
├── database-rules.md        (applies_to: backend/**/*Migration*.cs) → priority: high → Load ✅
├── backend-patterns.md      (applies_to: backend/src/**/*.cs) → priority: high → Load ✅
└── workflow-integration.md  (applies_to: backend/src/**/*Workflow*.cs) → No match → Skip

Result: Both database-rules.md + backend-patterns.md auto-appended (both high priority)
Conflict resolved by specificity: database-rules.md (more specific for migrations) consulted first
```

---

## Auto-Loading Mechanism

### How Rules Are Detected

1. User edits file matching `applies_to:` glob pattern
2. Harness scans `.github/copilot/rules/` directory
3. Matches file against all rule frontmatter `applies_to:` arrays
4. Loads matching rules → auto-appends to context for this session

### How Rules Stay in Context

- Rules loaded for this file remain in context for entire session
- User can disable with `/rule skip <name>` (temporary, this session only)
- User can force-load with `/rule force <name>` (even if not matched)
- Config `.claude/settings.json` `ruleOverrides:` disables globally

### Example Flow

```
User action: Edit backend/src/FactoryApp.WebApi/Queries/BuildQuery.cs

Harness execution:
1. Detect file path: backend/src/FactoryApp.WebApi/Queries/BuildQuery.cs
2. Scan .github/copilot/rules/*.md frontmatter
3. Match against applies_to patterns:
   ✓ backend-patterns.md (backend/src/**/*.cs matches) → priority: high
   ✓ graphql-patterns.md (backend/src/**/*Query*.cs matches) → priority: high
   ✗ accessibility-patterns.md (frontend/src/**/*.ts — no match)
4. Load rules in precedence order:
   - backend-patterns.md + graphql-patterns.md auto-appended to context
5. User can now reference rules in natural language or code editing
```

---

## Skill Integration: `applies_to:` Field

Skills (`.claude/skills/*/SKILL.md`) also have `applies_to:` metadata. When a skill's glob pattern matches the file being edited, the skill + related rules are auto-loaded.

### Example: Migration Generator Skill

```yaml
name: migration-generator
applies_to:
  - "backend/src/**/*.cs"
  - "backend/**/*.csproj"
```

**When user edits** `backend/src/FactoryApp.Domain/Entities/Build.cs`:

1. Harness detects file matches skill pattern
2. Loads `migration-generator` skill (with instructions for creating migrations)
3. Also loads `database-rules.md` (related rule)
4. Skill context + rule precedence guide code generation

---

## Tech Stack → Rule Mapping

| Tech Stack                  | Rule File                   | Key Constraints                                           | Commands                                       |
| --------------------------- | --------------------------- | --------------------------------------------------------- | ---------------------------------------------- |
| Angular 19+                 | `frontend-patterns.md`      | OnPush detection, trackBy, type-safety                    | `pnpm --filter frontend run build`, `ng serve` |
| ASP.NET Core .NET 10        | `backend-patterns.md`       | EF Core, DataLoaders, projections, testing                | `dotnet build`, `dotnet test`                  |
| Hot Chocolate GraphQL       | `graphql-patterns.md`       | Query depth ≤5, DTO only, no entity exposure              | `dotnet build` (emits schema.graphql)          |
| EF Core + Dapper            | `database-rules.md`         | Shared transactions, real-DB testing, indexes             | `dotnet ef migrations add`, `dotnet test`      |
| Elsa v3.5.3                 | `workflow-integration.md`   | Primitive keys only, stateless activities, async patterns | `dotnet build`, `dotnet watch run`             |
| Accessibility (WCAG 2.1 AA) | `accessibility-patterns.md` | Keyboard nav, ARIA, focus management, 44×44px targets     | `pnpm test:a11y`, `audit:lighthouse`           |

---

## Manual Rule Control

### Skip a Rule (This Session)

```
/rule skip database-rules.md
```

Disables the rule for this session. Other rules still load automatically. Rules re-enable on next session.

### Force-Load a Rule (Even if Not Matched)

```
/rule force accessibility-patterns.md
```

Loads rule even if file path doesn't match `applies_to:` glob. Useful when working on components that should follow accessibility patterns but aren't detected automatically.

### View Active Rules

```
/rule list
```

Shows all currently loaded rules for this file + session.

---

## Common Workflows

### Creating an EF Core Migration

**File**: `backend/src/FactoryApp.Domain/Entities/Build.cs` (entity change)

**Auto-loaded rules**:

- ✅ `backend-patterns.md` (backend/src/**/*.cs)
- ✅ `database-rules.md` (if migration file touched)

**Workflow**:

1. Edit entity
2. Run: `dotnet ef migrations add AddBuildHistory`
3. Copilot references `database-rules.md` for real-DB testing pattern
4. Test with: `dotnet test backend/src` (SQL Server required)

### Building a GraphQL Query Resolver

**File**: `backend/src/FactoryApp.WebApi/Queries/BuildQuery.cs`

**Auto-loaded rules**:

- ✅ `backend-patterns.md`
- ✅ `graphql-patterns.md`

**Workflow**:

1. Edit resolver
2. Copilot ensures: DTOs only (not raw entities), projections, DataLoaders
3. Run: `dotnet build` (emits schema.graphql)
4. Run: `pnpm codegen` (regenerates graphql.ts)
5. Frontend automatically gets type-safe queries

### Implementing Accessible Component

**File**: `frontend/src/app/dashboard/dashboard.component.ts`

**Auto-loaded rules**:

- ✅ `frontend-patterns.md` (Angular specifics)
- ✅ `accessibility-patterns.md` (shared across frontend)

**Workflow**:

1. Edit component
2. Copilot ensures: OnPush detection, trackBy on *ngFor, semantic HTML
3. Accessibility audit: `pnpm audit:lighthouse` (should score 90+)

---

## Debugging Auto-Loading

If a rule didn't auto-load when you expected:

1. **Check file path**: Does it match `applies_to:` glob?

   ```bash
   # Test glob manually
   ls backend/src/**/*.cs  # Should match backend-patterns.md
   ```

2. **Check frontmatter**: Is `applies_to:` valid YAML?

   ```bash
   head -15 .github/copilot/rules/backend-patterns.md | grep -E "applies_to:|^---"
   ```

3. **Force-load manually**: `/rule force backend-patterns.md`

4. **Check priority**: High-priority rules load before medium

---

## File Reference

- **Source Rules** (reference): [.claude/rules/](../../.claude/rules/) (6 architecture files)
- **Skills Index**: [.claude/skills/INDEX.md](../../.claude/skills/INDEX.md)
- **Settings**: [.claude/settings.json](../../.claude/settings.json) + [.claude/settings.local.json](../../.claude/settings.local.json)
- **Documentation**: [CLAUDE.md](../../CLAUDE.md), [AGENTS.md](../../AGENTS.md), [.github/copilot-instructions.md](../copilot-instructions.md)

---

## Related Documentation

- **Backend Patterns**: See [backend-patterns.md](./backend-patterns.md) (EF Core, Dapper, testing)
- **Frontend Patterns**: See [frontend-patterns.md](./frontend-patterns.md) (Angular, type-safety)
- **GraphQL Rules**: See [graphql-patterns.md](./graphql-patterns.md) (query depth, entity exposure)
- **Database Rules**: See [database-rules.md](./database-rules.md) (transactions, migrations)
- **Accessibility**: See [accessibility-patterns.md](./accessibility-patterns.md) (WCAG 2.1 AA)
- **Workflows**: See [workflow-integration.md](./workflow-integration.md) (Elsa v3.5.3)
