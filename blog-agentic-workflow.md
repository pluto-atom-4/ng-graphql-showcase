# Agentic Coding with Claude Code: Three Lessons from Issue #75

**Published:** 2026-06-19  
**Context:** GraphQL compliance overhaul (Issue #75 → 4 PRs, 58 tests, 0 failures)

---

## The Problem

As a **solo developer**, the biggest challenge with AI agents is **maintaining your own grip on context while the agent executes work**.

Without structured tracking, you lose:

- What the issue originally asked for vs. what got implemented
- Whether the agent's solution actually solves the problem
- How to hand off or resume work if interrupted

In early June, I faced this at scale:

- **Issue #75** flagged 11 critical/medium compliance gaps in GraphQL resolvers
- Scope: 4 interrelated systems (auth, validation, logging, transactions)
- Requirements: Complete refactoring, not ad-hoc patching

Traditional approach: Write local analysis docs, send code + docs to Claude, wait for feedback.  
**Result:** Lost track of original requirements. Didn't know if PRs actually addressed all issues. 3-4 extra turns to verify.

I discovered a better way using **GitHub's native UI for tracking agentic workflows**.

---

## 1. GitHub Issues as the "Single Source of Truth" for AI Agents

**The Practice:**
Instead of local markdown files, document requirements, findings, and acceptance criteria _directly_ in the GitHub issue. As a solo developer, _you read the issue yourself_ to grip what the agent is working on. The agent also reads the issue to orient itself.

**Why This Works:**

- **Issue #75** contained the full compliance review: 8 critical issues, impact assessment, remediation checklist
- You (solo dev) can open the GitHub issue anytime to see the original problem statement
- Agent reads the same issue + codebase to understand scope
- **No manual briefing needed.** Both you and the agent construct understanding from authoritative sources
- Issues stay current (unlike stale local docs that diverge from code)

**The GitHub Issue UI itself becomes your tracking dashboard:**

- Title: What's the problem?
- Body: Complete analysis with checklist
- Comments: Agent's closure evidence + your questions
- Linked PRs: See which changes address which issues

**Example from Issue #75:**

```
Title: GraphQL Implementation Review: BuildQuery & BuildMutation Compliance Assessment

Body:
## 🔴 Critical Issues

#### 1. Missing Projections on GraphQL Queries [HIGH]
- Location: BuildQuery.cs:9-11, 14-23
- Issue: No [UseProjection] attribute
- Impact: 10x unnecessary data transfer
- Fix: Add [UseProjection], [UseFiltering], [UseSorting]

...

## 📋 Remediation Checklist
- [ ] Add [UseProjection] attributes
- [ ] Add .AsNoTracking() to queries
- ...

Comments:
[Agent posts]: ✅ Closure Determination - YES, Issue #75 can be closed.
Evidence: All 11 critical issues addressed across 4 PRs...
```

**Result:**

- You can open the issue at any time to see: original problem + what agent implemented + closure evidence
- Clear linkage: Issue → PRs → tests → closure comment
- Agent doesn't need a briefing email; it reads the GitHub issue

---

## 2. Multiple Granular PRs Instead of One Monolithic PR

**The Practice:**
Break a large compliance overhaul into **4 focused PRs**, each addressing a related concern:

- **PR #77:** Core resolvers (projections, NoTracking, auth, event emission)
- **PR #78:** DataLoaders, DTO mapping, transaction management
- **PR #79:** Validation service, logging service
- **PR #80:** Unit tests, schema verification

**Why This Works (for Solo Developers):**

- **Reviewability:** Each PR is small enough to understand quickly when you review it
- **Incremental verification:** After PR #77 merges, you can see if it broke anything before PR #78 lands
- **Atomic fixes:** If PR #78 has an issue, you don't have to unwind 500 lines; just 1 focused PR
- **Testing isolation:** Tests in PR #80 verify _all_ prior PRs work together, giving you confidence the whole solution is correct

---

## 3. Let the AI Agent Close the Loop via GitHub PR/Issue UI

**The Practice:**
After all PRs merge, use a **bash script** to consolidate PR metadata, then ask Claude: _"Review these 4 PRs against Issue #75. Are all remediation criteria met?"_

Claude responds directly in a **GitHub issue comment**, which becomes your closure evidence.

**The Script:**
See [`scripts/summary_pr.sh`](./scripts/summary_pr.sh) — it extracts PR titles, bodies, and file changes, outputs JSON for Claude to analyze against the issue.

**Why This Works:**

- **You stay in the loop:** You can re-run the script anytime to see consolidated view of what changed
- **Agent has all context:** Script gives Claude the complete PR payload + Issue #75, so the agent can verify coverage
- **Permanent record:** Issue comment stays forever; future you (or team) can see the closure evidence
- **No external tools:** Everything happens in GitHub + Bash; no Notion, no Confluence

**Example Closure Comment (from Issue #75):**

```markdown
## ✅ Closure Determination

YES, Issue #75 can be closed.

**Evidence:**

- ✅ **All 11 critical/medium issues** addressed across 4 PRs (77-80)
- ✅ **58 tests passing** (0 failures) covering all resolvers, services, auth, validation
- ✅ **schema.graphql auto-generated correctly** with all mutations, queries, subscriptions
- ✅ **Compliance achieved:**
  - Projections + NoTracking optimization
  - Production-grade JWT + bcrypt
  - Elsa event integration
  - N+1 prevention via DataLoaders
  - DTO decoupling schema from DB
  - Explicit transaction management
  - Comprehensive validation + logging

**Recommended Action:** Merge PR #80 and close issue #75 as **COMPLETE**.
```

**Result:**

- Issue closes with full context
- You have searchable evidence of what "done" means
- Future developers can trace: Issue → PRs → tests → closure comment

---

## The Math (Solo Developer Efficiency)

| Phase                | Ad-Hoc Approach                                                        | Structured GitHub Approach                                                        |
| -------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Briefing**         | Email agent your analysis (10 min + 1 AI turn to clarify)              | Write GitHub issue once; agent reads it; you read it (no extra turns)             |
| **Implementation**   | 1 monolithic PR → agent refactors → you ask questions → 2-3 more turns | 4 focused PRs → agent refactors incrementally → you review each PR once           |
| **Verification**     | "Is this done?" email to agent → agent guesses                         | `summary_pr.sh` → agent reviews consolidated view against issue → closure comment |
| **Documentation**    | Separate doc that drifts                                               | GitHub issue + comments stay in sync with code                                    |
| **Total AI Turns**   | ~8-10 (briefing, multiple revisions, closure)                          | ~5-6 (implementation, 1 review per PR, final closure)                             |
| **Your Mental Load** | High (need to remember all 11 issues)                                  | Low (issue is always open in your tab)                                            |

---

## Key Insight: Grip Context via GitHub, Not Local Files

The three practices share a common theme:

**As a solo developer, your grip on the project comes from GitHub (Issues, PRs, Comments) — not local markdown files.**

When you do this:

- You can step away for 2 weeks and open the issue to remember what you were solving
- Agent doesn't need a briefing; it reads the same issue you do
- Closure evidence is permanent and searchable
- Future work reuses patterns from the issue template

---

## Lessons I'm Still Learning

1. **Issue scope:** Small scope (1-2 PRs) doesn't need this structure; big scope (4+ PRs, >1 week) does
2. **Script consistency:** `summary_pr.sh` saves time only if you use it every time; skipping it defeats the pattern
3. **Issue templates:** I now template new issues after Issue #75 to force upfront clarity
4. **PR linking:** Always link PRs to the issue via "Closes #75" in PR body; GitHub tracks the relationship automatically

---

## Takeaway for Solo Developers

If you're using Claude Code + GitHub Copilot as a solo developer:

1. **Put requirements in GitHub Issues** (grip context there, not in local brain/docs)
2. **Break large work into focused PRs** (easier to review, easier to verify each piece works)
3. **Let the AI agent close the loop** (via GitHub comment, not email; stays in the issue)
4. **Use scripts to consolidate** (e.g., summary_pr.sh) to give agent + yourself the full picture

You'll ship faster, maintain your own context better, and give future-you a clear trail of how the codebase evolved.

---

**Status:** Tested on Issue #75 (GraphQL compliance overhaul)  
**Outcome:** 11 issues → 4 PRs → 58 tests → 1 closure comment → Issue closed  
**Recommendation:** Use for any engineering initiative >3 PRs or >1 week scope

---

**Related:**

- [Issue #75: GraphQL Implementation Review](https://github.com/pluto-atom-4/ng-graphql-showcase/issues/75)
- [PR #77: Core Resolvers](https://github.com/pluto-atom-4/ng-graphql-showcase/pull/77)
- [PR #78: DataLoaders & DTOs](https://github.com/pluto-atom-4/ng-graphql-showcase/pull/78)
- [PR #79: Validation & Logging](https://github.com/pluto-atom-4/ng-graphql-showcase/pull/79)
- [PR #80: Tests & Schema](https://github.com/pluto-atom-4/ng-graphql-showcase/pull/80)
- [Script: summary_pr.sh](./scripts/summary_pr.sh)
