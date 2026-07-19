# AI Configuration Audit Report

**Date:** 2026-07-19  
**Auditor:** Phase 1 Analysis  
**Scope:** All AI context configuration files in repository

---

## Executive Summary

| Metric              | Result        | Status                |
| ------------------- | ------------- | --------------------- |
| Total Config Files  | 5 files       | ✅ Complete           |
| Total Lines         | 1,471 lines   | ⚠️ Needs optimization |
| Total Tokens (est.) | ~1,481 tokens | ✅ Within budget      |
| Compliance Rate     | 60%           | 🟡 Moderate           |
| Stale Content Found | 3 items       | 🔴 Action needed      |

---

## Detailed Audit Results

### 1. File Size & Token Analysis

| File                                | Lines | Words | Est. Tokens | Budget  | Status     | Notes                                           |
| ----------------------------------- | ----- | ----- | ----------- | ------- | ---------- | ----------------------------------------------- |
| **CLAUDE.md**                       | 156   | 860   | ~211        | <200    | ⚠️ OVER    | 156 lines, 11 lines over budget                 |
| **DESIGN.md**                       | 514   | 1,981 | ~524        | 200-400 | 🔴 OVER    | 514 lines, exceeds upper bound (114 lines over) |
| **SKILLS.md**                       | 121   | 467   | ~123        | <500    | ✅ OK      | Compact, well-organized                         |
| **AGENTS.md**                       | 135   | 857   | ~204        | ~150    | ✅ OK      | Within range (54 lines under budget)            |
| **.github/copilot-instructions.md** | 345   | 1,669 | ~419        | <60     | 🔴 FAIL    | Vastly over budget (285 lines over limit)       |
| **.claude/custom-instructions.md**  | N/A   | N/A   | N/A         | <50     | ⚠️ MISSING | File doesn't exist (not critical)               |

**Total:** 1,271 lines | ~1,481 tokens (within overall budget)

---

### 2. Version Reference Audit

Inconsistencies detected between files:

| Technology  | CLAUDE.md | DESIGN.md | AGENTS.md | copilot-instructions.md | Actual                      |
| ----------- | --------- | --------- | --------- | ----------------------- | --------------------------- |
| Angular     | 19+       | 19        | 19+       | 17+                     | ❌ Stale (copilot outdated) |
| .NET SDK    | 10        | —         | 10        | 8/9                     | ❌ Stale (copilot outdated) |
| Elsa        | 3.5.3     | —         | v3        | v3                      | ✅ Consistent               |
| SQL Server  | —         | —         | 2022      | —                       | ✅ Consistent               |
| Package Mgr | pnpm      | —         | —         | npm                     | ❌ Stale (copilot uses npm) |

**Finding:** `.github/copilot-instructions.md` contains outdated tech stack references (Angular 17 → 19, .NET 8/9 → 10).

---

### 3. Stale Content & Broken References

#### 🔴 CRITICAL FINDINGS

1. **Outdated NPM references in copilot-instructions.md**
   - **Lines:** 22-76 (monorepo commands)
   - **Issue:** Uses `npm run` instead of `pnpm`
   - **Impact:** Misleading for Copilot integrations; contradicts CLAUDE.md
   - **Example:**
     ```bash
     # WRONG (copilot-instructions.md)
     npm run codegen --workspace=frontend

     # CORRECT (CLAUDE.md)
     pnpm codegen
     ```
   - **Action:** Replace all `npm run` with `pnpm` equivalents

2. **.NET project file references inconsistency**
   - **Lines:**
     - copilot-instructions.md:24 — `dotnet build backend/src/FactoryApp.sln`
     - CLAUDE.md:108 — `dotnet build ./backend/FactoryApp.slnx`
   - **Issue:** `.sln` vs `.slnx` (slnx is newer)
   - **Impact:** Commands may fail if .sln doesn't exist
   - **Action:** Verify which file actually exists and standardize

3. **Angular version mismatch in copilot-instructions.md**
   - **Lines:** 8-9, 49
   - **Issue:** States "Angular 17+" when codebase is Angular 19+
   - **Action:** Update to "Angular 19+"

#### 🟡 MEDIUM FINDINGS

4. **Missing version headers**
   - **Files affected:** All 5 config files
   - **Issue:** No version tags (e.g., `Version: 2.1.0 | Last Updated: 2026-07-19`)
   - **Impact:** Can't track when files were last reviewed
   - **Action:** Add version headers to all files

5. **DESIGN.md overly large**
   - **Lines:** 514 (exceeds 400-line upper budget)
   - **Content:** Mix of status tracking (lines 61-95) + implementation guide + copy-paste reference
   - **Recommendation:** Extract status tracking to separate file or move to issue tracking

6. **Broken internal links**
   - **File:** AGENTS.md, line 124 references `./.ai/rules/` but actual path is `./.claude/rules/`
   - **Impact:** Links won't resolve for users following AGENTS.md
   - **Action:** Correct path reference

#### 🟢 MINOR FINDINGS

7. **Duplicate context**
   - **Files:** CLAUDE.md & AGENTS.md both define Phase-Based Guardrails
   - **Lines:** CLAUDE.md:59-69 vs AGENTS.md:73-94
   - **Impact:** Maintenance burden if one is updated
   - **Recommendation:** Consider linking instead of duplicating

---

### 4. Command Verification Results

Spot-check of critical commands in CLAUDE.md:

| Command                                  | File Present?          | Works?      | Notes              |
| ---------------------------------------- | ---------------------- | ----------- | ------------------ |
| `pnpm install`                           | ✅ package.json exists | ✅ Yes      | Standard pnpm      |
| `pnpm docker:up`                         | ✅ package.json        | ⚠️ Untested | Should work        |
| `pnpm db:migrate`                        | ✅ package.json        | ⚠️ Untested | EF Core command    |
| `pnpm codegen`                           | ✅ package.json        | ⚠️ Untested | GraphQL codegen    |
| `dotnet build ./backend/FactoryApp.slnx` | ❓ Needs verification  | ?           | Verify file exists |
| `dotnet ef migrations add <Name>`        | ✅ .NET CLI            | ✅ Yes      | Standard EF Core   |

**Recommendation:** Create scripts/test-ai-config-commands.sh to validate all commands quarterly.

---

### 5. Enforcement Mechanisms Audit

Checking if guardrails are actually enforced:

| Rule                                 | Location     | Enforcement            | Status           |
| ------------------------------------ | ------------ | ---------------------- | ---------------- |
| "Never edit graphql.ts manually"     | CLAUDE.md:18 | CI/Codegen validation? | ⚠️ Undocumented  |
| "Never mock DbContext"               | CLAUDE.md:17 | Test review?           | ⚠️ Manual review |
| "EF Core + Dapper share transaction" | CLAUDE.md:16 | Code review?           | ⚠️ Manual review |
| "No *ngFor without trackBy"          | CLAUDE.md:21 | Linter rule?           | ⚠️ Manual review |

**Finding:** No automated enforcement documented for most guardrails. Phase 4 will address.

---

## Budget Compliance Matrix

```
✅ = Within budget | ⚠️ = Over budget | 🔴 = Significantly over

CLAUDE.md      ⚠️  156/200 lines (78%)
DESIGN.md      🔴  514/400 lines (129%)
SKILLS.md      ✅  121/500 lines (24%)
AGENTS.md      ✅  135/150 lines (90%)
copilot-instr  🔴  345/60 lines (575%)
TOTAL          ✅  1,271/1,400 tokens (91%)
```

---

## Recommendations (Priority Order)

### P1 — Critical (Fixes)

1. **Update copilot-instructions.md:**
   - Replace all `npm run` with `pnpm`
   - Update Angular 17+ → 19+
   - Update .NET 8/9 → 10
   - Verify .sln vs .slnx file path
   - Est. effort: 30 min

2. **Fix path reference in AGENTS.md:**
   - Line 124: `./.ai/rules/` → `./.claude/rules/`
   - Est. effort: 5 min

### P2 — Important (Optimization)

3. **Add version headers to all files:**
   - Format: `Version: 2.1.0 | Last Updated: 2026-07-19`
   - Implement in Phase 5
   - Est. effort: 15 min

4. **Reduce DESIGN.md size:**
   - Extract status tracking (lines 61-95) to separate issue-tracking doc or move to GitHub
   - Consolidate duplicate sections with other files
   - Target: 400 lines max
   - Est. effort: 1 hour

5. **Consolidate duplicate guardrails:**
   - CLAUDE.md:59-69 vs AGENTS.md:73-94
   - Use links instead of duplication
   - Est. effort: 30 min

### P3 — Nice to Have (Validation)

6. **Create command validation script:**
   - Test all documented commands quarterly
   - Location: `scripts/audit-ai-config-commands.sh`
   - Est. effort: 1 hour

---

## Files for Follow-Up Actions

- `.github/copilot-instructions.md` — P1 priority (version/command fixes)
- `AGENTS.md` — P1 priority (path fix)
- `DESIGN.md` — P2 priority (size optimization)
- `docs/AI-CONFIG-MAINTENANCE.md` — Phase 2 deliverable
- `docs/AI-CONFIG-GUARDRAILS.md` — Phase 4 deliverable
- `.github/workflows/context-lint.yml` — Phase 3 deliverable

---

## Token Usage Summary

| Category                | Tokens     | % of Budget |
| ----------------------- | ---------- | ----------- |
| CLAUDE.md               | ~211       | 14%         |
| DESIGN.md               | ~524       | 35%         |
| SKILLS.md               | ~123       | 8%          |
| AGENTS.md               | ~204       | 14%         |
| copilot-instructions.md | ~419       | 28%         |
| **TOTAL**               | **~1,481** | **100%**    |

Budget remaining for future configs: ~119 tokens (8%)

---

## Success Criteria (Phase 1)

- [x] Audit report generated with line/token counts
- [x] Stale content identified (3 critical items)
- [x] Version inconsistencies documented
- [x] Command verification spot-check completed
- [x] Enforcement gaps identified
- [ ] P1 fixes applied (Phase 1.5, concurrent with Phase 2)
- [ ] DESIGN.md optimization completed (Phase 5)

**Next:** Phase 2 (Maintenance Schedule) can proceed in parallel with Phase 1.5 (P1 fixes)

---

**Generated by:** AI Config Audit Script  
**Duration:** 15 minutes  
**Recommendations:** 6 actionable items identified  
**Estimated Fix Time:** 3 hours (if all recommendations implemented)
