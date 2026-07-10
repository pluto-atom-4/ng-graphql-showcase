# SKILLS.md

Procedural workflow automation macros. Each skill is a deterministic playbook for routine tasks.

**Use**: Reference when you need Claude to execute a specific procedure (PR review, migration generation, codegen sync, etc.)

---

## Skill Index

### Code & Architecture

| Skill                   | Trigger                | Purpose                                                   | Location                              |
| ----------------------- | ---------------------- | --------------------------------------------------------- | ------------------------------------- |
| **PR Review Workflow**  | `/code-review`         | Automated PR quality review (bugs, security, performance) | `.claude/skills/pr-review-workflow/`  |
| **Migration Generator** | `/migration-generator` | Safe EF Core migration with validation + rollback         | `.claude/skills/migration-generator/` |
| **CodeGen Sync**        | `/codegen-sync`        | Sync schema.graphql → auto-generate graphql.ts            | `.claude/skills/codegen-sync/`        |
| **LSP Setup**           | `/lsp-setup`           | Language server initialization for IDE support            | `.claude/skills/lsp-setup/`           |

### Specialized Tasks

| Skill                   | Trigger               | Purpose                                              | Location                   |
| ----------------------- | --------------------- | ---------------------------------------------------- | -------------------------- |
| **Secure GitHub Repo**  | `/secure-github-repo` | Branch protection, secret scanning, merge strategies | Available in system skills |
| **Code Review (Ultra)** | `/code-review ultra`  | Deep multi-agent cloud review of branch/PR           | Trigger from user request  |
| **Fix GitHub Issues**   | `/fix-github-issues`  | Auto-fix issues based on issue templates             | Available in system skills |

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

## Skill Maintenance

**When to add a skill:**

- Task requires 3+ manual steps AND runs monthly+
- Common friction point reported in friction-log.md
- Procedure has strict ordering/validation requirements

**When to update a skill:**

- Tool/library changes breaking the automation
- New acceptance criteria discovered
- User provides friction feedback

**Log changes**: Update friction-log.md with triggers, outcomes, token savings

---

## Reference

See **CLAUDE.md** for core behavior rules.  
See **.claude/rules/** for domain-specific patterns.  
See **DESIGN.md** for visual consistency guidance.
