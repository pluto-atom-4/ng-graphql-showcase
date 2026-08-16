# SKILLS.md

**Version:** 1.2.0 | **Last Updated:** 2026-08-16

Procedural workflow automation macros. Each skill is a deterministic playbook for routine tasks.

**Use**: Reference when you need Claude to execute a specific procedure (PR review, migration generation, codegen sync, etc.)

---

## Skill Dependencies Graph

**Execution order matters for multi-step workflows**. This graph shows which skills should run in sequence:

```
migration-generator ──→ codegen-sync ──→ pr-review-workflow
    (DB change)            (schema sync)     (final check)
         ↓                       ↓                  ↓
    Creates migration    Regenerates types   Validates all
    Updates schema.graphql    Updates           changes
                           graphql.ts


performance-audit ──→ [standalone, can run anytime]
(Profile, Lighthouse)

pr-review-workflow ──→ [standalone, final gate before merge]
(Quality review)

lsp-setup ──→ [one-time setup, no dependencies]
(IDE configuration)

pre-commit-enforce ──→ [runs per commit, no dependencies]
(Hook validation)
```

**Legend**:

- `skill1 ──→ skill2` = Run skill2 after skill1 completes
- `[standalone]` = Can run independently, no prerequisite
- `(annotation)` = What the skill does

**Common Workflow Sequence**:

1. **Backend Schema Change** → `migration-generator` (create migration) → `codegen-sync` (regenerate types)
2. **Code Review Gate** → `pr-review-workflow` (audit before merge)
3. **Performance Check** (optional) → `performance-audit` (profile + metrics)

---

## Skill Index & Cross-Reference Matrix

**Complete skill inventory with metadata, dependencies, and trigger keywords**:

| Skill Name              | Trigger Keywords                                 | Purpose                                                          | Version | Depends On | Related Skills      | Path                                                                          |
| ----------------------- | ------------------------------------------------ | ---------------------------------------------------------------- | ------- | ---------- | ------------------- | ----------------------------------------------------------------------------- |
| **codegen-sync**        | `codegen`, `schema change`, `graphql regenerate` | Sync schema.graphql → auto-generate graphql.ts with type-safety  | 1.0.1   | —          | migration-generator | [.claude/skills/codegen-sync/](../.claude/skills/codegen-sync/)               |
| **lsp-setup**           | `LSP`, `IDE setup`, `language server`            | Language server initialization for IDE support (go-to-def, refs) | 1.0.0   | —          | —                   | [.claude/skills/lsp-setup/](../.claude/skills/lsp-setup/)                     |
| **migration-generator** | `migration`, `DB change`, `EF Core`              | Safe EF Core migration creation with validation + rollback       | 1.1.0   | —          | codegen-sync        | [.claude/skills/migration-generator/](../.claude/skills/migration-generator/) |
| **performance-audit**   | `performance audit`, `profile`, `lighthouse`     | Lighthouse + bundle analysis + profiling for performance metrics | 1.0.0   | —          | —                   | [.claude/skills/performance-audit/](../.claude/skills/performance-audit/)     |
| **pr-review-workflow**  | `review PR`, `PR review`, `code review`          | Automated PR quality review (bugs, security, performance, tests) | 1.0.0   | —          | —                   | [.claude/skills/pr-review-workflow/](../.claude/skills/pr-review-workflow/)   |
| **pre-commit-enforce**  | `pre-commit`, `validation`, `lint check`         | Pre-commit hook validation (format, lint, type check)            | 1.0.0   | —          | —                   | [.claude/skills/pre-commit-enforce/](../.claude/skills/pre-commit-enforce/)   |

**See [.claude/skills/INDEX.md](./.claude/skills/INDEX.md) for full metadata schema and trigger keyword index.**

---

## Skill Execution Patterns

### Pattern: Pre-Commit Validation

```
1. Read file
2. Lint/typecheck
3. Run relevant tests
4. Commit if clean
5. Post result to PR/issue
```

**Used by**: PR Review, Migration Generator, CodeGen Sync

### Pattern: Branch Workflow

```
1. Create feature branch from main
2. Execute changes (migrations, codegen, config)
3. Verify no regressions (dotnet test, pnpm test)
4. Push to remote
5. Create PR with detailed description
```

**Used by**: Migration Generator

### Pattern: Multi-Agent Orchestration

```
1. Spawn specialized agent (Explore, Plan, Code Review)
2. Pass context + constraints
3. Await completion
4. Synthesize results
5. Report to user
```

**Used by**: Code Review (Ultra)

---

## Configuration

### Skill Overrides (`.claude/settings.json`)

Enable/disable skills:

```json
{
  "skillOverrides": {
    "pr-review-workflow": "on",
    "migration-generator": "on",
    "codegen-sync": "on",
    "secure-github-repo": "on"
  }
}
```

### Skill Parameters

Each skill accepts optional parameters:

| Skill                 | Parameters          | Example                                                              |
| --------------------- | ------------------- | -------------------------------------------------------------------- |
| `migration-generator` | `name`, `isolation` | `migration-generator --name AddWorkflowHistory --isolation=worktree` |
| `code-review`         | `effort`, `comment` | `code-review --effort=high --comment`                                |
| `codegen-sync`        | None                | `codegen-sync`                                                       |

---

## Skill Governance & Maintenance

### When to Add a New Skill

- ✅ Task requires **3+ manual steps** AND runs **monthly+**
- ✅ Common friction point reported in `.claude/friction-log.md`
- ✅ Procedure has **strict ordering/validation requirements**
- ✅ Automation produces **measurable time savings** (>15 min/run)

### When to Update a Skill

- ✅ Tool/library changes breaking automation
- ✅ New acceptance criteria discovered via testing
- ✅ User provides friction feedback (logged in friction-log.md)
- ✅ Dependency chain changes (e.g., migration-generator now depends on lsp-setup)

### Version Bump Rules

**Skill-level versioning** (independent from SKILLS.md):

| Bump              | Trigger                                   | Example                                                 |
| ----------------- | ----------------------------------------- | ------------------------------------------------------- |
| **Patch (1.0.1)** | Bug fix, keyword addition, documentation  | Add `schema regenerate` keyword to codegen-sync         |
| **Minor (1.1.0)** | Feature addition, new parameter, refactor | migration-generator now supports `--isolation=worktree` |
| **Major (2.0.0)** | Breaking change, tool upgrade, API shift  | Migration from Hot Chocolate v12 → v13                  |

**SKILLS.md-level versioning** (reflects registry structure, discovery mechanism):

| Version       | Change                                          |
| ------------- | ----------------------------------------------- |
| 1.1.0 → 1.2.0 | Added dependency graph + cross-reference matrix |
| 1.2.0 → 1.3.0 | Changed discovery mechanism or registry schema  |

### Change Log Template

When updating a skill, add entry to `.claude/skills/<name>/CHANGELOG.md`:

```markdown
## [1.1.0] - 2026-08-16

### Added

- Support for `--isolation=worktree` flag in migration-generator

### Changed

- Updated dependency: now runs after codegen-sync

### Fixed

- Bug where migration fails on SQL Server 2019

### Migration

- Users should re-run `migration-generator` for existing migrations
```

### Maintenance Checklist (Monthly)

- [ ] Review `.claude/friction-log.md` for skill friction points
- [ ] Check all skills have valid `last_updated` dates (within 60 days)
- [ ] Audit `dependencies:` arrays for circular dependencies
- [ ] Test random skill invocation to verify discovery
- [ ] Update `.claude/skills/INDEX.md` if skills added/removed
- [ ] Verify all trigger keywords resolve to active skills
- [ ] Check cross-references in CLAUDE.md + AGENTS.md are current

---

## Reference

See **CLAUDE.md** for core behavior rules.  
See **.claude/rules/** for domain-specific patterns.  
See **DESIGN.md** for visual consistency guidance.
