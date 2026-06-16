# Procedures & Workflows

Standard procedures for code reviews, GitHub Copilot integration, and team workflows.

---

## PR Review Workflow

When reviewing a GitHub PR in this repository, execute this **three-phase workflow**:

### Phase 1: Analyze

**Objective:** Understand what the PR changes and why.

1. Fetch PR details:

```bash
gh pr view <PR_NUMBER> --json title,description,body,commits,files
```

2. Check linked issue (if any):

```bash
gh issue view <ISSUE_NUMBER> --json title,body,assignees
```

3. Review all code changes:

```bash
git fetch origin pull/<PR_NUMBER>/head:pr-branch
git diff main...pr-branch --stat       # Summary of changes
git diff main...pr-branch              # Full diff
```

4. Check CI/CD status:

```bash
gh pr checks <PR_NUMBER>
```

5. Understand the goal: Does PR solve the issue? Are tests passing?

### Phase 2: Review

**Objective:** Assess code quality against monorepo patterns.

Use the `/code-review` skill:

```bash
/code-review --effort high
```

This agent checks:

- **Type Safety Pipeline** — C# entities → schema.graphql → graphql.ts
- **Shared Transactions** — EF Core + Dapper atomicity
- **DataLoaders** — Prevent N+1 queries
- **Change Detection** — Angular OnPush + trackBy
- **Entity Exposure** — No raw EF entities in GraphQL
- **Elsa State** — Only primitives stored in workflows

Generate structured assessment:

- **Verdict:** APPROVED / CHANGES_REQUESTED / NEEDS_INFO
- **Requirements Matrix** — Does PR meet issue requirements?
- **File Analysis** — Per-file quality, impact, risks
- **Testing** — Are tests adequate?

### Phase 3: Post Comment to GitHub

**MANDATORY:** Post review as PR comment so team sees assessment.

```bash
gh pr comment <PR_NUMBER> --body "$(cat <<'EOF'
# 🔍 PR Review: Add Build Priority Field

## Summary

✅ APPROVED FOR MERGE

## Requirements

| Requirement | Implementation | Status |
|---|---|---|
| Add Priority field to Build | Added `int Priority { get; set; }` in Build entity | ✅ Done |
| Update GraphQL schema | [UseProjection] enables field in schema | ✅ Done |
| Test coverage | 3 new tests: default value, update, query | ✅ Done |
| Database migration | Migration CreateTable + AddColumn | ✅ Done |
| Type-safe frontend | graphql.ts auto-generated | ✅ Done |

## File Analysis

### backend/src/FactoryApp.Domain/Entities/Build.cs

- **Purpose:** Add Priority field with default value 0
- **Quality:** Good—follows existing pattern, proper validation
- **Impact:** Minor—backward compatible (default value for existing rows)
- **Testing:** Unit test covers default value + update scenario

### backend/src/FactoryApp.Domain/Migrations/20260616_AddBuildPriority.cs

- **Purpose:** Create migration for new field
- **Quality:** Good—proper EF Core pattern, idempotent SQL
- **Impact:** Schema change—all instances must run migration
- **Testing:** No test; apply on staging first

### frontend/src/app/components/build-form.component.ts

- **Purpose:** Add Priority input to build form
- **Quality:** Good—uses OnPush detection, proper binding
- **Impact:** Minor—new form field, no breaking changes
- **Testing:** Component test validates input range

## Verification

- [x] Type safety maintained across pipeline
- [x] All tests pass (unit + integration)
- [x] Database migration tested locally
- [x] GraphQL schema includes new field
- [x] Frontend types auto-generated
- [x] No shared transaction issues (single entity update)
- [x] Change detection optimal (OnPush enabled)

**Verdict: APPROVED FOR MERGE**

---
*Reviewed by: Claude Code*
EOF
)"
```

**Key Rules:**

- ✅ Always post comment (mandatory for visibility)
- ✅ Use structured format (tables, checklists)
- ✅ Reference requirements explicitly
- ✅ Focus on logic, architecture, security
- ✅ Include testing verification
- ❌ Never skip comment posting
- ❌ Never post incomplete reviews

---

## GitHub Copilot CLI Integration

Use GitHub Copilot CLI for code assistance in this repository.

### Ask Questions

```bash
# Interactive mode (shows suggestions in terminal)
gh copilot -- -i "How does the GraphQL type-safety pipeline work?"

# Get suggestions
gh copilot -- -i "Write a test for the shared transaction pattern"

# Ask about specific code
gh copilot -- -i "Why do we use DataLoaders in Hot Chocolate?"
```

### Use Installed Plugins

This repository has a custom plugin for factory-app-specific guidance:

```bash
# List installed plugins
gh copilot -- plugin list

# Use factory-app plugin
gh copilot -- -i "Document this architectural work for my portfolio"

# Run specific skill
gh copilot -- -i "Use the factory-app-session-blog skill to summarize this session"
```

### Available Skills

**Claude Code Skills** (auto-loaded):

- `factory-app-session-blog` — Document session as portfolio blog posts
- `fix-github-issues` — Auto-fix GitHub issues
- `secure-github-repo` — Repository security hardening
- `update-config` — Configure Claude Code settings

Invoke via `/skill-name` in Claude Code.

---

## Commit Message Format

Use conventional commit messages:

```bash
git commit -m "feat: add Build priority field with migration

- Add Priority property to Build entity (default: 0)
- Create EF Core migration for new column
- Update GraphQL schema auto-generation
- Add unit + integration tests
- Update frontend form component

Fixes #42"
```

**Format:**

```
<type>: <subject>

<body>

<footer>
```

**Types:**

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `refactor:` — Code restructuring (no behavior change)
- `test:` — Test additions/changes
- `chore:` — Build, CI, dependencies
- `perf:` — Performance improvement

**Body:** Explain _why_, not _what_ (git diff shows _what_)

**Footer:** Reference issues (`Fixes #42`, `Closes #99`)

---

## Branch Naming

Use kebab-case with category:

```bash
# Feature
git checkout -b feat/issue-42-build-priority

# Bug fix
git checkout -b fix/issue-89-graphql-deadlock

# Documentation
git checkout -b docs/database-migration-guide

# Refactor
git checkout -b refactor/simplify-dataloader-pattern
```

---

## Release Checklist

Before cutting a release:

- [ ] All PRs merged to main
- [ ] All tests passing (CI/CD green)
- [ ] Database migrations tested on staging
- [ ] GraphQL schema exported and validated
- [ ] Frontend type generation successful
- [ ] Performance benchmarks within threshold
- [ ] Security scan clean (no vulnerabilities)
- [ ] Release notes drafted
- [ ] Version bumped (semantic versioning)
- [ ] Tag created: `v1.2.3`
- [ ] Release notes published

---

## Troubleshooting Workflows

### PR Fails CI/CD

1. **Check logs:**

```bash
gh pr checks <PR_NUMBER>
```

2. **Debug locally:**

```bash
git fetch origin pull/<PR_NUMBER>/head:pr-branch
git checkout pr-branch
pnpm build
pnpm test
```

3. **Fix issues and push:**

```bash
# Make fixes
git add .
git commit -m "fix: resolve CI failures"
git push origin pr-branch
```

### Merge Conflicts

```bash
# Update branch from main
git fetch origin
git merge origin/main

# Resolve conflicts in editor
# Mark as resolved
git add <resolved-files>
git commit -m "chore: resolve merge conflicts with main"
git push origin pr-branch
```

### Revert a Merged PR

```bash
# Create revert commit
git revert <commit-hash>
git push origin main

# Or create PR with revert
git revert -m 1 <merge-commit>
gh pr create --title "Revert: PR #123 (reason)"
```

---

## Code Owners & Approval

**CODEOWNERS** file (if defined):

```
# Backend
backend/src/FactoryApp.GraphQL/   @graphql-team
backend/src/FactoryApp.Workflows/ @workflows-team

# Frontend
frontend/src/                      @angular-team

# Database
backend/src/FactoryApp.Domain/     @dba-team
```

PRs automatically request review from code owners.

---

## References

- **README.md** — Quickstart
- **docs/ARCHITECTURE.md** — Design patterns for review checklist
- **docs/DATABASE.md** — Migration validation
- **CLAUDE.md** — AI assistant guidance
