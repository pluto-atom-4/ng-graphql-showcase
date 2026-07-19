# AI Configuration Maintenance Schedule

**Effective Date:** 2026-07-19  
**Owner:** Full-stack engineering team  
**Review Cycle:** Monthly + Event-driven (see triggers below)

---

## Overview

AI context configuration files (CLAUDE.md, DESIGN.md, SKILLS.md, AGENTS.md, .github/copilot-instructions.md) represent a recurring token cost injected into every LLM turn. This document defines:

1. **When** to review each file (schedule)
2. **How** to version changes (protocol)
3. **What** events trigger updates (triggers)
4. **Who** is responsible (ownership)

---

## Maturity Levels & Review Cadence

### 🟢 Golden (Stable, Quarterly Review)

**Files:** CLAUDE.md, DESIGN.md

**Why:** Core guardrails + architecture patterns rarely change. Reviewed quarterly unless a major event forces earlier review.

**Review Schedule:**

- Q1 Review: April 1-15
- Q2 Review: July 1-15 ← **Current cycle (2026-07-19)**
- Q3 Review: October 1-15
- Q4 Review: January 1-15 (next year)

**Checklist:**

- [ ] Verify all version references match current stack
- [ ] Check for obsolete patterns or workarounds
- [ ] Audit stale command references
- [ ] Review duplicate content with other files
- [ ] Assess token count; recommend optimization if >110% of budget
- [ ] Update version header (see protocol below)
- [ ] Commit changes with `chore: Q[X] review - CLAUDE.md/DESIGN.md`

**Escalation:** If 3+ items need fixing, create issue for explicit visibility.

---

### 🟡 Evolving (Monthly Review, Tech-Dependent)

**Files:** SKILLS.md, AGENTS.md, .github/copilot-instructions.md

**Why:** Skills change as new MCP servers/tools are integrated. AGENTS & copilot-instructions need updates when frameworks release breaking changes.

**Review Schedule:**

- Every 1st Monday of the month (next: August 4)
- Faster review (15 min spot-check) vs. golden files
- Deep review if trigger events detected

**Checklist (Monthly Spot-Check):**

- [ ] Verify CLI tool versions in command examples still work
- [ ] Check for new skills added to `.claude/skills/`
- [ ] Scan for framework version references (Angular, .NET, Elsa)
- [ ] Verify skill links are active and paths correct
- [ ] Token count stable (within ±5% of last review)

**Checklist (Trigger Event):**

- [ ] Full audit of commands (test if possible)
- [ ] Update all version references
- [ ] Cross-reference against CLAUDE.md for consistency
- [ ] Extend version header patch version (e.g., 2.1.0 → 2.1.1)

**Responsible:** Implementation engineer (rotates monthly)

---

### 🔴 Tech-Debt (Ad-Hoc, Event-Driven)

**Items:** Command examples, technology stack section references

**Why:** Stale immediately upon SDK/framework release. Requires urgent update.

**Trigger Events:**

1. **Angular major version** (19 → 20)
2. **.NET major version** (10 → 11)
3. **Elsa major/minor version** (3.5.3 → 3.7.x)
4. **SQL Server major version** release
5. **Hot Chocolate breaking changes** (detect via schema.graphql updates)

**Action on Trigger:**

- Create GitHub issue: `[Chore] Update AI config for [Technology] v[X]`
- Assign to current oncall maintainer
- Expected PR within 48 hours
- Bump **major version** on CLAUDE.md (e.g., 2.0.0 → 3.0.0)

---

## Version Numbering Protocol

### Format

```
Version: MAJOR.MINOR.PATCH | Last Updated: YYYY-MM-DD
```

**Example:**

```markdown
---
Version: 2.1.3 | Last Updated: 2026-07-19
---
```

### Rules

1. **MAJOR** — Increment when:
   - Core architecture/guardrails change (rare)
   - Breaking changes in framework versions (Angular 19→20, .NET 10→11)
   - Significant guardrail additions/removals
   - Example: "Auth pattern now mandatory → all resolvers must use `@Authorize`"

2. **MINOR** — Increment when:
   - New pattern documented (e.g., new workflow integration)
   - New skill added to SKILLS.md
   - Non-breaking tech version bump (Elsa 3.5.3 → 3.7.x)
   - Example: "Added Elsa 3.7 patterns for stateless activities"

3. **PATCH** — Increment when:
   - Command reference updated
   - Typos/links fixed
   - Token budget optimization (e.g., consolidate duplicate sections)
   - Example: "Updated pnpm commands for new monorepo structure"

4. **No version bump for:**
   - Whitespace-only changes
   - Formatting/prettier changes
   - Comment rewording (same meaning)

### Location in Files

**CLAUDE.md:**

```markdown
# CLAUDE.md

Version: 2.1.0 | Last Updated: 2026-07-19

AI agent guidance router. Modular rules + skills...
```

**AGENTS.md, DESIGN.md, SKILLS.md:**

```markdown
# [Filename]

Version: 1.2.0 | Last Updated: 2026-07-19

[Description]...
```

**copilot-instructions.md:**

```markdown
# Copilot Instructions for ng-graphql-playground

Version: 1.0.1 | Last Updated: 2026-07-19

This guide helps Copilot work effectively...
```

---

## Technology Version Trigger Points

### Angular Versioning

| Current | Trigger Event | Action                              | Config Impact     |
| ------- | ------------- | ----------------------------------- | ----------------- |
| 19      | 19.1 release  | Minor review (backwards compatible) | Patch version     |
| 19      | 20 (major)    | Full audit + breaking changes       | **MAJOR version** |
| 20      | 20.1 LTS      | Document LTS stability              | Minor version     |

**Command Check:**

- `pnpm --filter frontend run ng --version`
- Verify in `frontend/package.json`: `"@angular/core": "^19..."`

---

### .NET SDK Versioning

| Current | Trigger Event | Action                        | Config Impact      |
| ------- | ------------- | ----------------------------- | ------------------ |
| 10      | 10.x patch    | Minor review                  | Patch version      |
| 10      | 11 (major)    | Full audit + breaking changes | **MAJOR version**  |
| 11      | EOL announced | Prepare migration plan        | Track in changelog |

**Command Check:**

- `dotnet --version` (reports SDK version)
- Verify in `backend/global.json` or `.csproj` files

---

### Elsa Workflows Versioning

| Current | Trigger Event | Action                                | Config Impact     |
| ------- | ------------- | ------------------------------------- | ----------------- |
| 3.5.3   | 3.5.4 (patch) | Verify changelog for breaking changes | Patch version     |
| 3.5.3   | 3.7.0 (minor) | Review new activity patterns          | Minor version     |
| 3.5.3   | 4.0.0 (major) | Full architecture review              | **MAJOR version** |

**Command Check:**

- Check `backend/src/FactoryApp.Domain/FactoryApp.Domain.csproj` for `<Elsa.* Version=...>`
- Review official [Elsa changelog](https://github.com/elsa-workflows/elsa-core/releases)

---

### SQL Server Versioning

| Current | Trigger Event   | Action                                   | Config Impact |
| ------- | --------------- | ---------------------------------------- | ------------- |
| 2022    | 2022 CU release | Verify compatibility; check docker image | Patch version |
| 2022    | 2024 release    | Test compatibility; migration plan       | Minor version |

**Command Check:**

- `docker compose ps` → verify `microsoft/mssql-server:2022-latest`
- Run: `SELECT @@VERSION;` in SQL Server

---

### Hot Chocolate GraphQL Versioning

| Current | Trigger Event         | Action                               | Config Impact     |
| ------- | --------------------- | ------------------------------------ | ----------------- |
| Latest  | Minor update          | Verify schema.graphql no regressions | Patch version     |
| Latest  | Major breaking change | Full resolver audit                  | **MAJOR version** |

**Command Check:**

- `dotnet build backend/FactoryApp.slnx` → inspect `backend/src/FactoryApp.WebApi/schema.graphql`
- Check NuGet packages: `dotnet outdated backend/src`

---

## Monthly Maintenance Checklist

**Due:** 1st Monday of every month (15 min)

```markdown
### [Month] Maintenance Review

**Date Completed:** [Fill in]
**Reviewer:** [Name]

#### Spot-Check (5 min)

- [ ] SKILLS.md: Any new skills added? Paths correct?
- [ ] AGENTS.md: Version refs up-to-date (Angular, .NET, Elsa)?
- [ ] copilot-instructions.md: Command examples work?
- [ ] Token counts: All files within ±5% of last review?

#### Framework Versions (5 min)

- [ ] Run: `pnpm --filter frontend run ng --version` → Angular ___
- [ ] Run: `dotnet --version` → .NET ___
- [ ] Check docker image tag → SQL Server ___
- [ ] Any major version changes? → Escalate if yes

#### Updates Applied (5 min)

- [ ] Version bumps documented (if any)
- [ ] Commit message format: `chore: [Month] maintenance - config files`
- [ ] Pushed to branch for review

---
```

**Template:** Copy above to monthly PR description (see Procedures section).

---

## Quarterly Deep Review Checklist (Golden Files)

**Due:** Q1, Q2, Q3, Q4 on dates above (1 hour)

```markdown
### Q[X] 2026 Deep Review: CLAUDE.md / DESIGN.md

**Date Completed:** [Fill in]
**Reviewer:** [Name]

#### File Review (30 min each)

- [ ] Read entire file top-to-bottom
- [ ] Verify all command examples work (spot-test 3 critical commands)
- [ ] Check for duplicate content with other config files
- [ ] Identify any patterns marked as "TODO" or "FIXME"
- [ ] Token count analysis: __ lines / __ tokens

#### Content Audit (15 min)

- [ ] Guardrails in NEVER section still enforced?
- [ ] Phase-based ordering (CLAUDE.md #148 → #149 → #147) still valid?
- [ ] Links to docs/rules files still accurate?
- [ ] References to GitHub issues still open?

#### Version Bump (5 min)

- [ ] Determine version bump: MAJOR / MINOR / PATCH
- [ ] Update header: `Version: X.Y.Z | Last Updated: YYYY-MM-DD`
- [ ] Commit: `chore: Q[X] review - CLAUDE.md` (include summary of changes)

#### Recommendations (5 min)

- [ ] Any P1/P2 items identified from audit?
- [ ] Create GitHub issue if optimization needed?
- [ ] Schedule follow-up review if urgent?

---
```

**Template:** Create GitHub issue with above checklist 1 week before review date.

---

## Incident Response

### Scenario 1: Framework Version Released (Mid-Cycle)

**Example:** Angular 20 releases on 2026-08-15 (outside monthly review)

**Action:**

1. Create issue: `[Chore] Update AI config for Angular 20 release`
2. Assign to next available maintainer
3. Run audit: `docs/AI-CONFIG-AUDIT.md` (30 min)
4. Update files: CLAUDE.md, AGENTS.md, copilot-instructions.md (1 hour)
5. Bump MAJOR version: `2.0.0 → 3.0.0`
6. PR → review → merge within 48 hours
7. Post in Slack: "AI config updated for Angular 20; LLM agents now aligned with latest framework"

**SLA:** 48 hours from issue creation to merge

---

### Scenario 2: Guardrail Enforcement Gap Discovered

**Example:** Team notices "Never edit graphql.ts manually" is not enforced

**Action:**

1. Create issue: `[Chore] Enforce graphql.ts guardrail with CI check`
2. Link to Phase 3 deliverable (.github/workflows/context-lint.yml)
3. Implement linter rule (Phase 3)
4. Document enforcement in AGENTS.md
5. Bump MINOR version in AGENTS.md

**SLA:** Depends on enforcement complexity (1-3 weeks)

---

### Scenario 3: Stale Command Found by User

**Example:** User reports `pnpm codegen` no longer works (script renamed to `pnpm generate`)

**Action:**

1. Verify the issue (run command locally)
2. Update all config files with correct command
3. Bump PATCH version in affected files
4. Run `docs/AI-CONFIG-AUDIT.md` to find other occurrences
5. Commit: `fix: Update codegen command references`

**SLA:** Same day (blocking issue for new developers)

---

## Ownership & Responsibilities

### Monthly Maintainer (Rotates)

**Role:** Spot-check SKILLS.md, AGENTS.md, copilot-instructions.md

**Frequency:** 1st Monday of every month (15 min)

**Rotation:** Assign via GitHub project board or Slack reminder

**Deliverable:** Merged PR with maintenance checklist completed

### Quarterly Reviewer (Rotates)

**Role:** Deep review CLAUDE.md + DESIGN.md

**Frequency:** Q1, Q2, Q3, Q4 on scheduled dates (1 hour)

**Rotation:** Senior engineer or architect

**Deliverable:** Merged PR with deep review checklist completed

### Tech Stack Maintainer (Oncall)

**Role:** Monitor framework releases; trigger immediate updates on major versions

**Frequency:** Continuous monitoring (no schedule)

**Tools:** GitHub Releases watch, Slack notifications for framework announcements

**Escalation:** Create issue within 24 hours of release announcement

---

## Integration with CI/CD

### Pre-Commit Hook (Phase 3)

Validates that:

1. Config files exist (no accidental deletion)
2. File sizes within budget
3. Version headers present
4. No broken internal links

### GitHub Actions (Phase 3)

Workflow: `.github/workflows/context-lint.yml`

**Triggers:**

- On push to main/develop
- On pull request
- Manual trigger

**Checks:**

- File presence validation
- Line count budget enforcement
- Command reference verification

**Outcome:**

- ✅ Pass: PR can merge
- 🟡 Warning: PR can merge but flag for manual review
- ❌ Fail: PR blocked until fixed

---

## Coordination with Issue Phases

**Issue #215** defines 5 implementation phases:

| Phase                | Deliverable                            | Maintenance Hook                          |
| -------------------- | -------------------------------------- | ----------------------------------------- |
| Phase 1 (Audit)      | docs/AI-CONFIG-AUDIT.md                | Baseline established; used for monitoring |
| Phase 2 (This)       | docs/AI-CONFIG-MAINTENANCE.md          | **Schedule & version protocol defined**   |
| Phase 3 (CI/CD)      | .github/workflows/context-lint.yml     | Automation enforces compliance            |
| Phase 4 (Guardrails) | docs/AI-CONFIG-GUARDRAILS.md           | Enforcement mechanisms documented         |
| Phase 5 (Updates)    | Updated config files + version headers | Ongoing maintenance begins here           |

**Timeline:** Phases should complete by 2026-08-19 (30 days from audit start).

---

## Changelog Format

When creating PR commits, use this format:

```
chore: [Q[X] review | Maintenance | Fix] - CLAUDE.md/DESIGN.md/...

Summary of changes:
- Updated Angular references: 19 → 20
- Fixed pnpm command in copilot-instructions.md
- Consolidated duplicate patterns from CLAUDE.md & AGENTS.md
- Version bump: 2.0.0 → 2.1.0

Compliance check:
- Line count: 156/200 (78%) ✅
- Token estimate: ~211 tokens ✅
- Broken links: 0 ✅
- Stale commands: 0 ✅
```

---

## Reference Links

- **AI Config Audit:** `docs/AI-CONFIG-AUDIT.md` (Phase 1 output)
- **Guardrail Enforcement:** `docs/AI-CONFIG-GUARDRAILS.md` (Phase 4 output)
- **CI/CD Automation:** `.github/workflows/context-lint.yml` (Phase 3 output)
- **Configuration Files:** CLAUDE.md, DESIGN.md, SKILLS.md, AGENTS.md, copilot-instructions.md
- **Rules Router:** `.claude/rules/` (5 domain-specific pattern files)

---

## Success Criteria

- [x] Review schedule defined (quarterly golden, monthly evolving, ad-hoc tech-debt)
- [x] Version protocol documented (MAJOR/MINOR/PATCH rules)
- [x] Technology trigger points listed (Angular, .NET, Elsa, SQL Server, Hot Chocolate)
- [x] Monthly checklist created (15 min spot-check)
- [x] Quarterly checklist created (1 hour deep review)
- [x] Incident response procedures defined (3 scenarios)
- [x] Ownership model established (rotation + oncall)
- [x] Integration with CI/CD workflow outlined
- [ ] Phase 3 CI/CD workflow implemented (next phase)

**Next:** Phase 3 (Automated Context Validation CI/CD Workflow)

---

**Effective Date:** 2026-07-19  
**Last Updated:** 2026-07-19  
**Maintenance Owner:** Full-stack engineering team  
**Next Scheduled Review:** 2026-10-01 (Q4 deep review — CLAUDE.md, DESIGN.md)
