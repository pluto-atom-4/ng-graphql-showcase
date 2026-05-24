# GitHub Implementation Flow Workflow for Copilot

**Purpose**: Define the standardized procedure Copilot must follow when implementing GitHub issues to ensure consistency, quality, and complete auditability.

**Scope**: All GitHub issue implementations (via `code-review` agent, `task` agent, or manual implementation requests)

---

## Overview

When asked to implement a GitHub issue, Copilot executes a **mandatory multi-phase workflow** with **feature branch tracking and implementation plan creation** as required steps.

This ensures all implementations are traceable, auditable, and meet quality standards before merge.

---

## Phase 1: Issue Analysis & Setup

### 1.1 Read & Understand the Issue

- [ ] Read GitHub issue title, description, and acceptance criteria
- [ ] Identify linked issues (dependencies, blocking issues, related work)
- [ ] Extract requirements and success criteria
- [ ] Note timeline, priority, and any constraints
- [ ] Clarify ambiguous requirements before starting

### 1.2 Plan Implementation

- [ ] Determine scope: Single-phase or multi-phase?
- [ ] Identify files that will be created/modified/deleted
- [ ] Decide on architecture approach (if applicable)
- [ ] Plan for testing strategy
- [ ] Consider documentation needs

### 1.3 Create Feature Branch

- [ ] Extract GitHub issue number from the issue
- [ ] Create feature branch: `feat/issue-<N>-<kebab-case-name>`
- [ ] Verify branch follows naming convention
- [ ] Push branch to remote immediately

---

## Phase 2: Implementation Planning & Documentation

### 2.1 Copy & Complete Implementation Plan

**Use the standardized template:**

1. Copy template: `.github/copilot/templates/IMPLEMENTATION_PLAN_TEMPLATE.md`
2. Save to: `docs/implementation-planning/issue-<N>-<name>.md`
3. Fill in all required sections:

```markdown
## Issue Information
- GitHub Issue: #[N]
- Feature Branch: feat/issue-[N]-...
- Status: In Progress

## Executive Summary
[2-3 sentence overview]

## Problem Statement
[What are we solving]

## Solution Approach
[How are we solving it]

## Implementation Criteria
[✅ Mandatory checklist - ALL must pass before merge]
- [ ] Code formatting: pnpm format passes
- [ ] Linting: pnpm lint passes
- [ ] Tests: pnpm test passes
- [ ] Type safety: No TypeScript errors
- [ ] Security: No secrets/credentials
- [ ] Documentation: Updated
- [ ] File manifest: Accurate
- [ ] Code review: Passed Issue #19 procedure
- [ ] Acceptance criteria: Verified

## File Manifest
[Track all created/modified/deleted files]

### Files Created
| File Path | Purpose | Status |
|-----------|---------|--------|
| ... | ... | ✅/⏳/❌/🔄 |

### Files Modified
| File Path | Changes | Status |
|-----------|---------|--------|
| ... | ... | ✅/⏳/❌/🔄 |

## Acceptance Criteria
[Verification table with specific items]

## Next Steps
[Post-implementation action items]
```

### 2.2 Initial Commit of Plan

```bash
git add docs/implementation-planning/issue-<N>-*.md
git commit -m "docs: Create implementation plan for Issue #<N>"
git push origin feat/issue-<N>-...
```

---

## Phase 3: Implementation & Continuous Updates

### 3.1 Implement Features

While implementing, update the file manifest continuously:

```bash
# Create/modify file
touch frontend/src/new-file.ts

# Update implementation plan immediately
# Edit: docs/implementation-planning/issue-<N>-*.md
# Update "Files Created" with ✅ status

# Commit with clear message
git add frontend/src/new-file.ts docs/implementation-planning/issue-<N>-*.md
git commit -m "feat: Add new component"
git push origin feat/issue-<N>-...
```

### 3.2 Run Pre-Commit Checks

Before committing each change, verify quality:

```bash
# Format code
pnpm format

# Lint
pnpm lint --workspace=frontend

# Test
pnpm test

# Type check
cd frontend && pnpm exec tsc --noEmit
```

### 3.3 Update File Manifest Throughout

Keep file manifest in sync with changes:

- ✅ **Done**: Feature is complete and tested
- ⏳ **In Progress**: Currently being worked on
- ❌ **Blocked**: Cannot proceed (document reason)
- 🔄 **Pending Review**: Awaiting feedback

---

## Phase 4: Pre-PR Quality Gate

### 4.1 Verify All Implementation Criteria

Run final checks before creating PR:

```bash
# Full verification suite
pnpm format                               # Auto-format
pnpm lint --workspace=frontend            # Linting
pnpm test                                 # Tests
pnpm exec tsc --noEmit                   # Type safety
dotnet build backend/src/FactoryApp.sln  # Backend build
git diff --name-only                     # Compare to manifest
```

### 4.2 Validate File Manifest

```bash
# Get list of changed files
git diff --name-only origin/main...HEAD

# Verify all changed files are in manifest
# Each file should have status ✅ or documented reason
```

### 4.3 Update Acceptance Criteria

Verify all acceptance criteria items are met and marked as ✅.

---

## Phase 5: PR Creation & Review Procedure

### 5.1 Create PR

```bash
git push origin feat/issue-<N>-...

# GitHub creates PR link automatically (issue-linked branch)
# Fill in PR title: "feat: Issue #<N> - Description"
# Link issue: "Fixes #<N>" in description
```

### 5.2 Follow Issue #19 PR Review Procedure

Once PR is created:

1. **Phase 1**: Gather PR details, examine changes, check CI/CD
2. **Phase 2**: Analyze code against architecture patterns
3. **Phase 3**: **Post review comment to GitHub** ← MANDATORY

See [pr-review-workflow.md](pr-review-workflow.md) for complete procedure.

---

## Phase 6: Post-Merge Closure

### 6.1 Merge PR

After approval and all CI checks pass:

```bash
# Merge via GitHub UI or command line
git checkout main
git pull origin main
git merge feat/issue-<N>-...
git push origin main
```

### 6.2 Clean Up Feature Branch

```bash
git branch -d feat/issue-<N>-...
git push origin --delete feat/issue-<N>-...
```

### 6.3 Close Issue

GitHub auto-closes the issue when PR is merged (due to "Fixes #<N>" keyword).

---

## Execution Rules

### Must-Do Rules

1. ✅ **Always create feature branch linked to issue**
   - Branch naming: `feat/issue-N-kebab-case`
   - Enables automatic GitHub PR linking
   - Provides traceability

2. ✅ **Always create implementation plan document**
   - Copy from template: `.github/copilot/templates/IMPLEMENTATION_PLAN_TEMPLATE.md`
   - Save to: `docs/implementation-planning/issue-<N>-*.md`
   - Fill in ALL required sections

3. ✅ **Always update file manifest as you work**
   - Add files to manifest immediately upon creation/modification
   - Update status continuously (✅/⏳/❌/🔄)
   - Verify manifest accuracy before creating PR

4. ✅ **Always run pre-commit checks**
   - Format: `pnpm format`
   - Lint: `pnpm lint --workspace=frontend`
   - Test: `pnpm test`
   - Type check: `pnpm exec tsc --noEmit`

5. ✅ **Always follow Phase 3 PR review procedure**
   - Post review comment to GitHub PR
   - Include requirements matrix, file analysis, verdict
   - Ensure team visibility

### Must-NOT Rules

1. ❌ **Never skip the implementation plan document**
   - Even small changes need documentation
   - Plan is not optional; it's mandatory

2. ❌ **Never create PR without implementation plan**
   - Implementation plan is mandatory for traceability
   - Plan will be verified during Issue #19 PR review procedure

3. ❌ **Never skip file manifest updates**
   - File manifest must match git diff
   - Inaccurate manifest blocks merge

4. ❌ **Never commit without running checks**
   - Format, lint, test, type-check locally first
   - Don't rely on CI/CD to catch errors

5. ❌ **Never skip the PR review comment posting**
   - Posting verdict is mandatory, not optional
   - Ensures team awareness and audit trail

---

## Implementation Criteria (All Must Pass)

Every implementation must satisfy ALL of these before PR merge:

```markdown
- [ ] Code formatting: `pnpm format` passes
- [ ] Code passes linting: `pnpm lint --workspace=frontend`
- [ ] All tests pass: `pnpm test`
- [ ] TypeScript strict mode: No errors (`pnpm exec tsc --noEmit`)
- [ ] Security audit: No secrets, credentials, or API keys in code
- [ ] Documentation updated: README, CONTRIBUTING, relevant docs
- [ ] Backwards compatible: No breaking changes (unless documented)
- [ ] Performance verified: No regressions introduced
- [ ] Code review passed: Issue #19 mandatory procedure
- [ ] File manifest accurate: Matches git diff output
- [ ] Acceptance criteria verified: All items checked ✅
```

---

## Note: GitHub Actions Automation (Future Enhancement)

GitHub Actions automation for implementation plan validation is planned for **Issue #23** when team size grows. See `docs/implementation-planning/issue-22-implementation.md` for Phase 2 deferral rationale.

---

## Example Workflow Execution

### Scenario: Implement Issue #22 (Standardized Implementation Flow)

```bash
# Phase 1: Read and understand issue
# Issue: "Standardize GitHub implementation workflows with templates and validation"
# Requirements: Template file, GitHub Actions workflow, documentation

# Phase 2: Plan and set up
git checkout main && git pull
git checkout -b feat/issue-22-implementation-flow
cp .github/copilot/templates/IMPLEMENTATION_PLAN_TEMPLATE.md \
   docs/implementation-planning/issue-22-implementation.md

# Edit plan file with all required sections
# Commit plan
git add docs/implementation-planning/issue-22-implementation.md
git commit -m "docs: Create implementation plan for Issue #22"
git push -u origin feat/issue-22-implementation-flow

# Phase 3: Implement features
# Create template file
touch .github/copilot/templates/IMPLEMENTATION_PLAN_TEMPLATE.md
# Edit file...
# Update manifest: ✅ Files Created → IMPLEMENTATION_PLAN_TEMPLATE.md

# Update documentation
# Edit .github/copilot/README.md
# Update manifest: ✅ Files Modified → .github/copilot/README.md

# Commit progress
git add .github/copilot/templates/IMPLEMENTATION_PLAN_TEMPLATE.md \
        .github/copilot/README.md \
        docs/implementation-planning/issue-22-implementation.md
git commit -m "feat: Add implementation plan template and standardized procedures"
git push origin feat/issue-22-implementation-flow

# Phase 4: Pre-PR quality gate
pnpm format                               # ✅ Pass
pnpm lint --workspace=frontend            # ✅ Pass
pnpm test                                 # ✅ Pass
git diff --name-only                     # Verify against manifest

# Phase 5: Create PR
gh pr create --base main --head feat/issue-22-implementation-flow \
  --title "feat: Issue #22 - ..." \
  --body "Closes #22"
# Note: Manual verification of implementation plan is required before creating PR

# Phase 6: PR review (Issue #19 procedure)
# Phase 1: Gather PR details, examine changes
# Phase 2: Analyze code against conventions
# Phase 3: Post review comment with verdict

# Phase 7: Merge
# After approval: merge to main
# Issue closes automatically (Fixes #22 keyword)
```

---

## Related Documentation

- **Template**: [.github/copilot/templates/IMPLEMENTATION_PLAN_TEMPLATE.md](../templates/IMPLEMENTATION_PLAN_TEMPLATE.md)
- **PR Review Procedure**: [pr-review-workflow.md](pr-review-workflow.md)
- **Monorepo Architecture**: See `CLAUDE.md` for conventions
- **Contributing Guide**: See `CONTRIBUTING.md` for development process
- **Phase 2 Deferral**: See `docs/implementation-planning/issue-22-implementation.md`

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-05-23 | Initial implementation flow definition | Copilot |

---

**Last Updated**: 2026-05-23  
**Status**: Active  
**Applies To**: All Copilot implementations of GitHub issues
