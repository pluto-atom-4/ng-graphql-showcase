# Permissions & Governance Model

**Version:** 1.0.0 | **Last Updated:** 2026-08-16  
**Canonical:** `.claude/settings.json` + `.claude/settings.local.json` + PreToolUse/PostToolUse hooks

---

## Overview

Permission governance balances **developer velocity** (auto-approve safe ops) with **security** (block high-risk ops). This model defines three conceptual tiers with hook-based enforcement.

---

## Three-Tier Conceptual Model

### Tier 1: Deny (Hard Blocks)

**Definition**: Operations blocked by PreToolUse hooks. Require `! <command>` shell escape to override.

**Rationale**: Privilege escalation, secret leaks, and OS-level destruction must not execute accidentally.

**Patterns**:

| Operation          | Reason                    | How to Override              |
| ------------------ | ------------------------- | ---------------------------- |
| `sudo *`           | Privilege escalation      | `! sudo whoami`              |
| `curl.*password`   | Secret leak (credentials) | `! curl ... -d password=...` |
| `curl.*secret`     | Secret leak (API keys)    | `! curl ... -H Secret: ...`  |
| `curl.*token`      | Secret leak (auth tokens) | `! curl -H Token: ...`       |
| `rm -rf /`         | OS-level destruction      | Code change + review         |
| `git reset --hard` | Destructive git rewrite   | `! git reset --hard`         |
| `git push --force` | Forced push (CI risk)     | `! git push --force`         |
| `schema.graphql`   | Auto-generated file edit  | Run `dotnet build`           |
| `graphql.ts`       | Auto-generated file edit  | Run `pnpm codegen`           |

**Hook Location**: `.claude/settings.json` → `hooks.PreToolUse[0]` (Bash matcher)

---

### Tier 2: Ask (Interactive Prompts)

**Definition**: Operations intended for confirmation UX (currently blocked or allowed; future implementation).

**Rationale**: Risky but potentially legitimate ops (git push, deployment) should confirm intent.

**Current Status**: **Deferred to Phase 3** (requires interactive prompt support not in current schema)

**Future Patterns** (when Ask tier implemented):

| Operation        | Reason                         | Current Behavior |
| ---------------- | ------------------------------ | ---------------- |
| `git push`       | Publish changes                | Blocked (Tier 1) |
| `docker push`    | Upload container to registry   | Blocked (Tier 1) |
| `pnpm publish`   | Publish package to npm         | Blocked (Tier 1) |
| `dotnet publish` | Production deployment artifact | Blocked (Tier 1) |

**Note**: These are currently in Tier 1 (Deny) but conceptually belong in Tier 2 (Ask). Upgrade path documented below.

---

### Tier 3: Allow (Pre-Approved)

**Definition**: Operations automatically executed without user confirmation.

**Rationale**: Daily development workflows must not require manual approval.

**Global Patterns** (in `.claude/settings.json`):

- **Build tools**: `Bash(npm *)`, `Bash(dotnet *)`, `Bash(pnpm *)`
- **Testing**: `Bash(pnpm test)`, `Bash(pnpm build)`, `Bash(pnpm codegen)`
- **Read-only**: `Read`, `Glob`, `Grep`
- **File edit**: `Edit(...)`, `Write(...)` (restricted to safe paths)
- **External docs**: `WebFetch(domain:docs.elsaworkflows.io)`, `WebFetch(domain:api.github.com)`
- **Skills**: `Skill(codegen-sync)`, `Skill(migration-generator)`, etc.

**Local Overrides** (in `.claude/settings.local.json`, organized by domain):

- Backend test suites
- Frontend build & test
- E2E testing
- Docker local dev
- GitHub CLI operations
- Local GraphQL queries (localhost only)
- Linting & type-checking

**Total**: 87+ patterns (18 global + 69 local)

---

## Implementation Strategy (Phase 2)

Current architecture uses **hook-based deny** + **flat allow-list**:

```
Tool Invocation (Bash, Edit, etc.)
         ↓
    PreToolUse Hook
         ↓
  Matches Deny Pattern? → Block + "! escape required"
         ↓ (No)
  In Allow List? → Execute
         ↓ (No)
     ERROR: Not allowed
         ↓
   PostToolUse Hook → Log to tool-invocations.log
```

**Why this architecture**:

- Deny patterns are regex-based, can't express negative lookahead easily in flat allow-list
- Hooks execute server-side (before tool runs), reliable blocking
- Flat allow-list is simple to maintain, scales well
- Tool-invocations.log provides audit trail for weekly/monthly reviews

---

## Decision Matrix: Operation → Tier & Implementation

| Operation                     | Intended Tier | Current Implementation        | Override Method      | Notes                                   |
| ----------------------------- | ------------- | ----------------------------- | -------------------- | --------------------------------------- |
| `dotnet build`                | Allow         | Global allow-list             | Auto-execute         | Safe, local-only                        |
| `pnpm test`                   | Allow         | Global allow-list             | Auto-execute         | Safe, read-only output                  |
| `pnpm codegen`                | Allow         | Global allow-list             | Auto-execute         | Regenerates type-safe queries           |
| `gh issue create`             | Allow         | Local allow-list (GitHub)     | Auto-execute         | Safe, no mutation to local files        |
| `git log <path>`              | Allow         | Local allow-list              | Auto-execute         | Read-only                               |
| `curl localhost:5275/graphql` | Allow         | Local allow-list (local only) | Auto-execute         | Local dev server only                   |
| `git push origin`             | Ask (future)  | Tier 1 Deny (now)             | `! git push origin`  | Publishes code; needs confirmation      |
| `docker push`                 | Ask (future)  | Tier 1 Deny (now)             | `! docker push`      | Registry upload; high risk              |
| `pnpm publish`                | Ask (future)  | Tier 1 Deny (now)             | `! pnpm publish`     | Public npm package; irreversible        |
| `sudo whoami`                 | Deny          | Tier 1 Deny                   | Code change required | Privilege escalation                    |
| `curl -d password=...`        | Deny          | Tier 1 Deny                   | Code change required | Secret leak (hardcoded creds)           |
| `rm -rf /`                    | Deny          | Tier 1 Deny                   | Code change required | OS-level destruction                    |
| Edit `schema.graphql`         | Deny          | Tier 1 Deny (hook)            | Run `dotnet build`   | Auto-generated; edit source (C# entity) |
| Edit `graphql.ts`             | Deny          | Tier 1 Deny (hook)            | Run `pnpm codegen`   | Auto-generated; edit source (GraphQL)   |

---

## Common Daily Workflows (Tier 3 — Pre-Approved)

✅ **Automatically Approved**:

```bash
# Backend development
dotnet build backend/FactoryApp.slnx        # Compiles + emits schema.graphql
dotnet test backend/src                     # Runs integration tests vs SQL Server
dotnet ef migrations add MigrationName       # Creates EF Core migration

# Frontend development
pnpm codegen                                 # Regenerates graphql.ts from schema
pnpm --filter frontend run test              # Runs Vitest + Testing Library
pnpm --filter frontend run build             # Production build (Webpack)

# Testing
pnpm e2e                                     # Playwright E2E tests
pnpm --filter frontend run audit:lighthouse # Performance audit

# Infrastructure (local only)
pnpm docker:up                               # Spin up SQL Server container
pnpm docker:down                             # Tear down containers

# GitHub operations
gh issue create --title "..." --body "..."   # Create GitHub issue
gh pr list                                   # List open pull requests
gh label list                                # List repository labels
```

⚠️ **Blocked (Require `! <command>` prefix)**:

```bash
git push origin main                         # Use: ! git push origin main
docker push registry.io/myimage:tag          # Use: ! docker push ...
sudo systemctl restart nginx                 # Use: ! sudo ... (but not recommended)
```

❌ **Hard Denied** (Require code change + review):

```bash
# These CANNOT be escaped with ! prefix; requires editing .claude/settings.json
sudo su                                      # Privilege escalation
rm -rf /                                     # OS destruction
curl ... -d password=hardcoded_secret        # Credential leak
```

---

## Audit Trail: tool-invocations.log

**Location**: `.claude/tool-invocations.log`

**Format**: `timestamp|tool_type|command|decision|exit_code`

**Example**:

```
2026-08-16T10:30:00Z|Bash|pnpm test|allowed|0
2026-08-16T10:30:15Z|Bash|git push origin|denied|1
2026-08-16T10:35:42Z|Bash|dotnet build|allowed|0
2026-08-16T10:36:00Z|Bash|! git push origin|allowed|0
```

**Usage**: Weekly review to spot patterns; monthly to promote safe ops to pre-approval list.

---

## Permission Escalation & Maintenance Process

### Weekly Review

**Goal**: Spot patterns in usage

```bash
tail -20 .claude/tool-invocations.log
# Count denied operations
grep "|denied|" .claude/tool-invocations.log | wc -l
```

**Action**: If repeated denials for same operation (>5 in one week), mark for monthly review.

### Monthly Audit

**Goal**: Promote proven-safe operations from Ask tier to Allow tier

**Process**:

1. Review `tool-invocations.log` for operations with:
   - ≥10 successful executions
   - 0 exit code (success rate 100%)
   - No regressions in related tests
2. Add to `.claude/settings.local.json` allow-list
3. Bump `.claude/settings.local.json` version (patch)
4. Document in friction-log.md

**Example**: `git diff` between two branches has 50+ executions, 100% success → promote to allow-list.

### Quarterly Full Audit

**Goal**: Review all three tiers for drift

**Checklist**:

- [ ] No deny patterns accidentally blocking legitimate ops
- [ ] Allow-list not grown too permissive (>150 patterns)
- [ ] No hardcoded secrets in tool-invocations.log
- [ ] Ask tier still empty (waiting for interactive UX)
- [ ] Hooks still functioning (spot-check PreToolUse blocks)

---

## Future Upgrades (Phase 3+)

### Ask Tier: Interactive Prompts

**When available**: Claude Code schema supports interactive confirmation UI

**Implementation**:

```json
{
  "permissions": {
    "ask": ["Bash(git push *)", "Bash(docker push *)", "Bash(pnpm publish)"]
  }
}
```

**UX**: When user invokes `git push origin`, agent prompts: "Publish to remote? (y/n)"

### Permission Expiration

**When needed**: Time-limit temporary approvals

```json
{
  "permissions": {
    "allow": [
      {
        "pattern": "Bash(git push origin staging)",
        "expiresAt": "2026-09-16T23:59:59Z"
      }
    ]
  }
}
```

### Machine-Specific Secrets

**When needed**: Load CI tokens from secure storage (not in-repo)

```bash
# In CI (GitHub Actions):
export CLAUDE_CODE_GITHUB_TOKEN=$(gh auth token)
export CLAUDE_CODE_NPM_TOKEN=$(npm config get _authToken)
```

---

## File References

| File                           | Purpose                                |
| ------------------------------ | -------------------------------------- |
| `.claude/settings.json`        | Global permissions + hooks (Tier 1, 3) |
| `.claude/settings.local.json`  | User overrides (Tier 3)                |
| `.claude/tool-invocations.log` | Audit trail (auto-generated)           |
| `.claude/friction-log.md`      | Config changes (existing)              |
| `CLAUDE.md`                    | Best practices + environment vars      |

---

## Security Principles

1. **Defense in Depth**: Hooks block + tool restrictions + audit trail
2. **Fail Secure**: Unknown operations → ERROR (not allowed)
3. **Audit Trail**: All operations logged for weekly/monthly review
4. **Principle of Least Privilege**: Pre-approve only necessary operations
5. **Transparency**: Decision matrix + implementation strategy documented here

---

## Related Documentation

- [CLAUDE.md#Environment Variables](./CLAUDE.md#environment-variables-for-ai-tool-configuration)
- [.claude/settings.json](./settings.json)
- [.claude/settings.local.json](./settings.local.json)
