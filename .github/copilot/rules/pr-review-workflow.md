# GitHub PR Review Workflow for Copilot

**Purpose**: Define the automated procedure Copilot must follow when reviewing GitHub PRs to ensure quality, consistency, and visibility.

**Scope**: All GitHub PRs reviewed by Copilot (via `code-review` agent or manual review requests)

---

## Overview

When asked to review a GitHub PR, Copilot executes a **mandatory three-phase workflow** with **automated comment posting** as the final required step.

This ensures all code review outcomes are visible on GitHub for team awareness and audit purposes.

---

## Phase 1: PR Analysis & Setup

### 1.1 Gather PR Information

- [ ] Fetch PR number, title, description, branch, and author
- [ ] Identify linked issue(s) using `#ISSUE_NUMBER` format
- [ ] Read issue description to understand context and requirements
- [ ] Note the GitHub repository and PR URL for comment posting

### 1.2 Examine Code Changes

- [ ] Get list of changed files (additions, modifications, deletions)
- [ ] Retrieve diffs for each file using GitHub API or `git show`
- [ ] Check file-by-file line changes and context
- [ ] Identify affected modules (backend, frontend, docs, etc.)

### 1.3 Check CI/CD Status

- [ ] Retrieve GitHub Actions workflow results
- [ ] Document any failed tests, linting errors, or build issues
- [ ] Note skipped or incomplete CI jobs
- [ ] Flag if PR is not ready (draft, blocked, merge conflicts)

---

## Phase 2: Code Review & Assessment

### 2.1 Leverage Code-Review Agent

**Use the `code-review` agent for analysis:**

```
task:
  name: pr-review-analysis
  agent_type: code-review
  description: Review PR against requirements and conventions
  prompt: |
    Review PR #[NUMBER]: [TITLE]

    Issue: [ISSUE_LINK]
    Changed files: [LIST]

    Focus on:
    - Requirements fulfillment
    - Architecture violations
    - Type safety issues
    - Security concerns
    - Logic errors

    Do NOT comment on style or trivial matters.
```

### 2.2 Verification Checklist

For this monorepo, verify against:

- ✅ **End-to-End Type Safety**: Schema changes propagate correctly
- ✅ **Architecture Patterns**: Follows monorepo conventions (EF Core vs Dapper, DataLoaders, etc.)
- ✅ **Shared Transaction Rule**: Multi-step mutations coordinate correctly
- ✅ **Security**: No secrets, proper authentication/authorization
- ✅ **Testing**: Tests verify behavior; coverage isn't reduced
- ✅ **Documentation**: Changes include docs (README, CLAUDE.md, comments)
- ✅ **Performance**: No N+1 queries, GraphQL depth limits respected
- ✅ **Elsa Workflows**: Versioned correctly, old versions complete naturally

### 2.3 Generate Assessment Document

Create a structured review containing:

```markdown
# 🔍 PR Review: [PR Title]

## Executive Summary

[1-2 sentence verdict: Approved, Request Changes, or Comment]

## Requirements vs Deliverables

| Requirement  | Implementation    | Status                            |
| ------------ | ----------------- | --------------------------------- |
| [from issue] | [how PR meets it] | ✅ Done / ⚠️ Partial / ❌ Missing |

## File-by-File Analysis

### [File 1]

- **Purpose**: What this file does
- **Quality**: Code quality assessment (no errors, consistent)
- **Impact**: Effect on codebase (schema changes, architecture)
- **Testing**: How changes are verified
- **Risk**: Any potential issues

## Verification Results

- [x] Follows monorepo conventions
- [x] Architecture patterns correct
- [x] Type safety maintained
- [x] Tests pass and verify behavior
- [ ] [PR-specific item]

## Known Issues & Considerations

- [Issue or consideration for team awareness]

## Verdict

**✅ APPROVED FOR MERGE**
(Or: **⚠️ REQUEST CHANGES** - [specific items])

---

_Copilot Review | Generated at [TIMESTAMP]_
```

---

## Phase 3: Automated Comment Posting (REQUIRED)

### 3.1 Post Review to GitHub

**This is the MANDATORY final step — never skip this.**

After completing analysis and generating the assessment document:

```bash
# Post review as GitHub PR comment using here-document (safe from shell injection)
gh pr comment <PR_NUMBER> --body "$(cat <<'EOF'
[Review content goes here]
EOF
)"
```

**Safe Command Pattern:**

For multi-line review bodies, always use the here-document syntax to avoid shell injection:

```bash
gh pr comment 42 --body "$(cat <<'EOF'
# 🔍 PR Review: [Title]

## Summary
✅ APPROVED FOR MERGE

## File Analysis
- [Details]

## Verdict
**✅ APPROVED FOR MERGE**
EOF
)"
```

**Why this pattern?**

- Avoids shell expansion vulnerabilities with inline `"..."` strings
- Properly handles newlines and special characters in review text
- `'EOF'` (single quotes) prevents variable expansion in the here-document
- Safe to execute in restricted shell environments

### 3.2 Comment Content Requirements

The posted comment MUST include:

1. **Clear Verdict**
   - ✅ APPROVED FOR MERGE
   - ⚠️ REQUEST CHANGES [specific items]
   - 💬 COMMENT [note for awareness]

2. **Requirements Matrix**
   - Links back to issue requirements
   - Shows fulfillment status for each
   - Provides traceability

3. **File Analysis**
   - Organized by file or module
   - Quality and impact assessment
   - Specific concerns or praise

4. **Verification Checklist**
   - Project-specific items (type safety, transactions, etc.)
   - Test coverage confirmation
   - Performance validation

5. **Metadata**
   - Timestamp or PR link
   - Reference to issue
   - Signature ("Copilot Review")

### 3.3 When to Post Comments

**Post immediately after analysis if:**

- ✅ Analysis is complete and thorough
- ✅ All required sections are present
- ✅ At least one file was analyzed

**Do NOT post if:**

- ❌ Analysis is incomplete or partial
- ❌ You need clarification on requirements
- ❌ Error occurred during code review

---

## Execution Rules

### Must-Do Rules

1. ✅ **Always post review outcomes to GitHub**
   - Posting comment is mandatory, not optional
   - Ensures team visibility and audit trail
   - Provides context for future merging

2. ✅ **Use structured format**
   - Markdown tables for requirements and checklists
   - Clear sections and headers
   - Consistent formatting across reviews

3. ✅ **Reference requirements explicitly**
   - Link to issue (GitHub auto-links #ISSUE_NUMBER)
   - Show how each requirement is met
   - Provide traceability

4. ✅ **Include verdicts clearly**
   - Use emoji for quick scanning (✅ ⚠️ 💬)
   - Explain reasoning for REQUEST CHANGES
   - Be specific about what to fix

5. ✅ **Focus on signal, not noise**
   - Only comment on logic, architecture, security
   - Skip style and formatting issues
   - Mention positive patterns (what PR got right)

### Must-NOT Rules

1. ❌ **Never skip the comment posting step**
   - If analysis is done, comment must be posted
   - No partial reviews posted silently

2. ❌ **Never post incomplete reviews**
   - All required sections must be present
   - Don't post mid-analysis findings

3. ❌ **Don't focus on style alone**
   - Skip whitespace, naming, formatting comments
   - Mention style only if it masks logic issues

4. ❌ **Don't make assumptions about requirements**
   - If unclear, ask for clarification before posting
   - Link review back to issue for transparency

5. ❌ **Don't post generic templates**
   - Customize assessment to the specific PR
   - Add file-specific and issue-specific details

---

## Example Workflow Execution

### Scenario: Review PR #42

````bash
# User requests review
> "Review PR #42 and add your assessment to the GitHub comment"

# Copilot executes Phase 1
→ Reads PR #42: "Add DataLoader for Parts"
→ Links Issue #38: "Prevent N+1 queries in Build details"
→ Examines 3 files changed: GraphQL resolver, DataLoader, tests

# Copilot executes Phase 2
→ Launches code-review agent
→ Verifies DataLoader pattern matches conventions
→ Checks tests cover batch and single scenarios
→ Generates 2.5KB assessment document

# Copilot executes Phase 3 (MANDATORY)
→ Posts comment to GitHub PR using safe here-document:
```bash
gh pr comment 42 --body "$(cat <<'EOF'
# 🔍 PR Review: Add DataLoader for Parts

## Summary
✅ APPROVED FOR MERGE — Correctly implements batch loading pattern

## Requirements vs Deliverables
| Requirement | Implementation | Status |
|---|---|---|
| Prevent N+1 on Parts query | DataLoader batches PartIds correctly | ✅ Done |
| Maintain type safety | Types auto-generated from schema | ✅ Done |
| Include tests | Batch + single scenarios covered | ✅ Done |

## File Analysis
### PartDataLoader.cs
- Implements standard BatchFetchAsync pattern
- Handles null keys gracefully
- ✅ Good error handling

### PartQueryResolver.cs
- Uses DataLoader correctly
- No N+1 paths remain
- ✅ Query depth respects 5-layer limit

## Verification
- [x] Follows DataLoader pattern
- [x] All tests pass (9 new tests)
- [x] CI/CD green

**Verdict: APPROVED FOR MERGE**
EOF
)"
````

→ Comment posted successfully at 10:35 UTC
→ Team sees assessment immediately on PR page
→ Merge can proceed with confidence

````

---

## Integration with GitHub Copilot CLI

For GitHub Copilot CLI sessions (`gh copilot` commands):

```bash
# User asks for PR review via CLI
gh copilot explain "review PR #42"
gh copilot suggest "review PR #42 and add to GitHub"

# Copilot follows this workflow and posts comment to GitHub
# User can verify result on GitHub PR page
````

The comment posting is built into the workflow, so it executes automatically when review is complete.

---

## Troubleshooting

### Comment Posting Fails

**Problem**: `gh pr comment` returns error

**Solutions**:

1. Verify PR number and repository are correct
2. Check GitHub CLI authentication: `gh auth status`
3. Ensure comment text is valid Markdown
4. Retry command or use GitHub Web UI as fallback

### Comment Already Posted

**Problem**: Review already posted for this PR

**Solutions**:

1. Edit existing comment if minor updates needed
2. Post new comment if substantive changes found
3. Reference prior comment to avoid duplication

### Unclear Requirements

**Problem**: Can't determine if PR meets requirements

**Solutions**:

1. Add clarification question in comment
2. Request author to clarify in PR description
3. Link to related issue for context
4. Suggest waiting for issue refinement before merge

---

## Related Documentation

- **Code Review Guidelines**: See `/code-change-instructions.md` in system prompt
- **Monorepo Architecture**: See `CLAUDE.md` for conventions
- **GitHub PR Workflow**: See `CONTRIBUTING.md` for development process
- **Testing Strategy**: See `CLAUDE.md` for test expectations

---

## Revision History

| Date       | Change                      | Author  |
| ---------- | --------------------------- | ------- |
| 2026-05-22 | Initial workflow definition | Copilot |

---

**Last Updated**: 2026-05-22  
**Status**: Active  
**Applies To**: All Copilot PR reviews
