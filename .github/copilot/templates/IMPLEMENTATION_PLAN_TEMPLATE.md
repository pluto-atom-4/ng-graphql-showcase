# Implementation Plan Template

**Template Version**: 1.0  
**Last Updated**: 2026-05-23  
**Purpose**: Standardized format for GitHub issue implementations

---

## Issue Information

- **GitHub Issue**: #[ISSUE_NUMBER]
- **Feature Branch**: `feat/issue-[N]-[kebab-case-description]`
- **Status**: [Planned | In Progress | Ready for Review | Done]
- **Created**: [DATE]
- **Target Completion**: [DATE]

---

## Executive Summary

Brief 2-3 sentence overview of what this implementation accomplishes. Focus on the end result and impact, not implementation details.

**Example**: "This implementation standardizes GitHub issue workflows with feature branch naming conventions, file manifest tracking, and mandatory implementation criteria. Enables faster iterations and improved auditability across all team deliverables."

---

## Problem Statement

What problem are we solving? Why is this important?

### Current State
Describe the current situation or limitation.

### Desired State
What should happen after this implementation?

### Impact
Why does this matter for the project?

---

## Solution Approach

High-level overview of how we're solving the problem. Include:
- Key components/files
- Architecture decisions
- Technology choices (if any)
- Integration points

---

## Implementation Criteria

**All items below MUST be satisfied before PR merge:**

- [ ] Code formatting: `pnpm format` or `prettier --write .` passes
- [ ] Code passes linting: `pnpm lint --workspace=frontend`
- [ ] All tests pass: `pnpm test`
- [ ] TypeScript strict mode: No type errors (`pnpm exec tsc --noEmit`)
- [ ] Security audit: No secrets, credentials, or API keys in code
- [ ] Documentation updated: README, CONTRIBUTING, relevant docs
- [ ] Backwards compatible: No breaking changes (unless documented in issue)
- [ ] Performance verified: No regressions introduced
- [ ] Code review passed: Followed Issue #19 mandatory PR procedure
- [ ] File manifest accurate: Matches actual created/modified files
- [ ] Acceptance criteria verified: All items checked off

---

## File Manifest

Complete audit trail of all files created, modified, or deleted.

### Files Created

| File Path | Purpose | Status |
|-----------|---------|--------|
| path/to/file.ts | Brief description of what the file does | ✅/⏳/❌/🔄 |
| path/to/component.tsx | Brief description | ✅/⏳/❌/🔄 |

**Status Legend**: ✅ Done | ⏳ In Progress | ❌ Blocked | 🔄 Pending Review

### Files Modified

| File Path | Changes | Status |
|-----------|---------|--------|
| src/app/app.module.ts | Added import for new service | ✅/⏳/❌/🔄 |
| README.md | Added "Installation" section (lines 15-45) | ✅/⏳/❌/🔄 |

### Files Deleted

| File Path | Reason |
|-----------|--------|
| (none) | N/A |

---

## Phases

*(Include this section only for multi-phase implementations)*

### Phase 1: [Phase Title] (Week N)

**Goals**:
- Goal 1
- Goal 2

**Tasks**:
- 1.1 Task description
- 1.2 Task description
- 1.3 Task description

**Deliverables**:
- Deliverable 1
- Deliverable 2

---

### Phase 2: [Phase Title] (Week N+1)

**Goals**:
- Goal 1

**Tasks**:
- 2.1 Task description

**Deliverables**:
- Deliverable 1

---

## Acceptance Criteria

Verification checklist for post-implementation validation:

| Criteria | Implementation | Verification | Status |
|----------|----------------|--------------|--------|
| Feature works as designed | [Description] | [How to verify] | ✅/❌ |
| Performance targets met | [Description] | [Benchmark test] | ✅/❌ |
| Documentation complete | [Description] | [Link to docs] | ✅/❌ |
| Tests passing | [Description] | `pnpm test` output | ✅/❌ |

---

## Blockers (if any)

Document any blockers preventing implementation:

- [ ] **Blocker Title**: Description
  - **Impact**: How this affects the implementation
  - **Workaround**: Proposed workaround (if any)
  - **Timeline**: When this might be resolved

---

## Next Steps

Clear action items for after implementation:

1. [ ] Post PR for review (following Issue #19 mandatory procedure)
2. [ ] Address reviewer feedback
3. [ ] Merge to main after approval
4. [ ] [Additional step]
5. [ ] [Additional step]

---

## References

- **Linked Issue**: #[ISSUE_NUMBER]
- **Related Issues**: #[OTHER_ISSUES] (if any)
- **Implementation Flow Guide**: See [docs/IMPLEMENTATION_FLOW.md](../../docs/IMPLEMENTATION_FLOW.md)
- **PR Review Procedure**: See [.github/copilot/rules/pr-review-workflow.md](../rules/pr-review-workflow.md)

---

## Notes

Additional notes, decisions, or context about this implementation.

---

**Using this template?** Copy it to `docs/implementation-planning/issue-[N]-[name].md` and fill in all sections.
