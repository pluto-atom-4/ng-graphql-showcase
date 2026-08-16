# Skills Index — Master Catalog

**Version:** 1.0.0 | **Last Updated:** 2026-08-16  
**Canonical:** Discovery source for all registered skills in this repository.

---

## Skill Discovery Registry

**Complete mapping of trigger keywords → skill files:**

| Skill Name            | Trigger Keywords                                                           | Applies To (Auto-Load)                                                | Compatible With                            | Depends On | Related Skills      |
| --------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------ | ---------- | ------------------- |
| `codegen-sync`        | `codegen`, `schema change`, `graphql regenerate`, `type-safe sync`         | `backend/src/**/*.graphql`, `schema.graphql`, `frontend/**/*.graphql` | claude-code, github-copilot, claude-agents | —          | migration-generator |
| `lsp-setup`           | `LSP`, `IDE setup`, `language server`                                      | `.vscode/**`, `.idea/**`, `tsconfig.json`                             | claude-code, github-copilot                | —          | —                   |
| `migration-generator` | `migration`, `DB change`, `EF Core`, `entity change`                       | `backend/src/**/*.cs`, `backend/**/*Migration*.cs`                    | claude-code, github-copilot, claude-agents | —          | codegen-sync        |
| `performance-audit`   | `performance audit`, `profile`, `lighthouse`, `bundle size`, `memory leak` | `frontend/src/**/*.ts`, `frontend/src/**/*.html`                      | claude-code, claude-agents                 | —          | —                   |
| `pr-review-workflow`  | `review PR`, `PR review`, `code review`, `audit branch`                    | `**/.git/refs/heads/**`, `**/.github/workflows/**`                    | claude-code, github-copilot, claude-agents | —          | —                   |
| `pre-commit-enforce`  | `pre-commit`, `validation`, `lint check`, `enforce hooks`                  | `.husky/**`, `.git/hooks/pre-commit`                                  | claude-code                                | —          | —                   |

---

## Skill Dependencies Graph

```
codegen-sync ──→ depends on schema.graphql
    ↑
    └─ triggered AFTER migration-generator (DB schema changes)

migration-generator ──→ EF Core entity changes
    ↓
    └─ followed by codegen-sync (schema regeneration)

performance-audit ──→ standalone profiling (no dependencies)

pr-review-workflow ──→ standalone review (no dependencies)

lsp-setup ──→ one-time IDE configuration (no dependencies)

pre-commit-enforce ──→ git hook validation (no dependencies)
```

**Legend**:

- **Sequential**: `A → B` means run B after A completes
- **Standalone**: No arrows means skill can run independently
- **Suggested Pairing**: Related skills should run together (noted in registry)

---

## Trigger Keyword Index (Reverse Lookup)

**Find skills by keyword (case-insensitive)**:

| Keyword              | Skill               | Use Case                                    |
| -------------------- | ------------------- | ------------------------------------------- |
| `codegen`            | codegen-sync        | After `dotnet build` emits schema.graphql   |
| `schema change`      | codegen-sync        | Backend entity model updated                |
| `graphql regenerate` | codegen-sync        | Type-safety pipeline trigger                |
| `type-safe sync`     | codegen-sync        | Sync C# → schema.graphql → graphql.ts       |
| `LSP`                | lsp-setup           | Configure IDE language server               |
| `IDE setup`          | lsp-setup           | First-time IDE configuration                |
| `language server`    | lsp-setup           | Code intelligence / go-to-definition issues |
| `migration`          | migration-generator | Create EF Core migration                    |
| `DB change`          | migration-generator | Database schema/entity changes              |
| `EF Core`            | migration-generator | Entity Framework Core operations            |
| `entity change`      | migration-generator | Domain model entity updates                 |
| `performance audit`  | performance-audit   | Comprehensive performance profiling         |
| `profile`            | performance-audit   | Performance profiling request               |
| `lighthouse`         | performance-audit   | Lighthouse audit                            |
| `bundle size`        | performance-audit   | Bundle size analysis                        |
| `memory leak`        | performance-audit   | Memory leak detection                       |
| `review PR`          | pr-review-workflow  | Before merging PR                           |
| `PR review`          | pr-review-workflow  | Code review request                         |
| `code review`        | pr-review-workflow  | Automated PR analysis                       |
| `audit branch`       | pr-review-workflow  | Branch audit                                |
| `pre-commit`         | pre-commit-enforce  | Git pre-commit hook validation              |
| `validation`         | pre-commit-enforce  | Lint/format validation                      |
| `lint check`         | pre-commit-enforce  | Linting validation                          |
| `enforce hooks`      | pre-commit-enforce  | Hook enforcement                            |

---

## Adding New Skills

### Step 1: Create Skill File

```bash
mkdir -p .claude/skills/<name>
touch .claude/skills/<name>/SKILL.md
```

### Step 2: Add YAML Frontmatter

Use the standard schema from [AGENTS.md#skills-metadata-schema](../AGENTS.md#skills-metadata-schema):

```yaml
---
name: my-new-skill # Kebab-case
description: One-line purpose # What this skill does
version: 1.0.0 # Start at 1.0.0
last_updated: YYYY-MM-DD # Today's date
trigger: # At least 2-3 keywords
  - keyword1
  - keyword2
compatible_with:
  - claude-code
---
# Skill documentation follows
```

### Step 3: Update Registry

Add row to table above with skill metadata:

```markdown
| `my-new-skill` | `keyword1`, `keyword2` | claude-code | — | — | [.claude/skills/my-new-skill/SKILL.md](./my-new-skill/SKILL.md) |
```

### Step 4: Update Dependencies (if applicable)

If new skill depends on existing skills, add to `dependencies:` array in frontmatter.

### Step 5: Test Discovery

```bash
# Verify YAML frontmatter valid
head -20 .claude/skills/my-new-skill/SKILL.md | grep -E "^(---|\w+:)"

# Trigger keyword should work
# (Harness will auto-discover on next scan)
```

---

## Skill Versioning

**Independent from SKILLS.md versioning**:

- **SKILLS.md version** — Updated when skill registry structure or discovery mechanism changes
- **Individual skill versions** — Updated when skill's behavior/behavior changes
- **Bump rule**: When you modify a SKILL.md file, increment its `version:` field

**Example**:

```yaml
# Original
version: 1.0.0

# After adding keyword to trigger list
version: 1.1.0

# After fixing bug in skill logic
version: 1.1.1

# After major feature addition
version: 2.0.0
```

---

## Maintenance Guidelines

### Monthly Review

- [ ] Check if any triggers are orphaned (keyword in registry but skill deleted)
- [ ] Verify all skills have valid `last_updated` dates
- [ ] Audit `dependencies:` arrays for circular dependencies
- [ ] Test random skill invocation to verify discovery working

### When Adding New Skills

- [ ] Add to registry table
- [ ] Add to trigger keyword index
- [ ] Add to dependency graph (if applicable)
- [ ] Link from [AGENTS.md](../AGENTS.md) "Skill Discovery & Directory"

### When Removing Skills

- [ ] Remove from registry table
- [ ] Remove from trigger keyword index
- [ ] Update dependency graph
- [ ] Update AGENTS.md references
- [ ] Archive skill directory (don't delete; preserve git history)

---

## Cross-References

**Related Documentation**:

- [AGENTS.md — Skill Discovery & Directory](../AGENTS.md#skill-discovery--directory)
- [AGENTS.md — Skills Metadata Schema](../AGENTS.md#skills-metadata-schema)
- [CLAUDE.md — Skill Discovery & Auto-Invocation](../CLAUDE.md#skill-discovery--auto-invocation)
- [SKILLS.md — Automation Macros](../SKILLS.md)

**Individual Skill Docs**:

- [codegen-sync](./codegen-sync/SKILL.md)
- [lsp-setup](./lsp-setup/SKILL.md)
- [migration-generator](./migration-generator/SKILL.md)
- [performance-audit](./performance-audit/SKILL.md)
- [pr-review-workflow](./pr-review-workflow/SKILL.md)
- [pre-commit-enforce](./pre-commit-enforce/SKILL.md)
