# Evidence Artifacts & Gate 2 Verification

**Version:** 1.0.0 | **Updated:** 2026-07-25

Guide for collecting, storing, and validating evidence that tasks meet Gate 2 requirements.

---

## Overview

Gate 2 requires 4 types of evidence:

1. **Build Logs** — `dotnet build` + `pnpm build` output
2. **Test Output** — `pnpm test` results + coverage
3. **Type-Safety Checks** — `tsc --noEmit` + LSP verification
4. **Regression Analysis** — Before/after test summary

All evidence stored in `.claude/evidence/` with manifest tracking.

---

## Evidence Directory Structure

```
.claude/evidence/
├── MANIFEST.json                              # Index of all evidence
├── BUILD-issue-236-phase-1.log               # Backend build output
├── BUILD-issue-236-phase-1-frontend.log      # Frontend build output
├── TESTS-issue-236-phase-1.log               # Full test output
├── TESTS-issue-236-phase-1-coverage.json     # Coverage report (JSON)
├── TYPE-CHECK-issue-236-phase-1.log          # tsc output
├── REGRESSION-issue-236-phase-1.txt          # Before/after diff
└── README.md                                  # This file
```

---

## Collecting Evidence

### 1. Build Logs

**Capture**:

```bash
# Backend
dotnet build ./backend/FactoryApp.slnx 2>&1 | tee .claude/evidence/BUILD-issue-236-phase-1.log

# Frontend
pnpm build 2>&1 | tee .claude/evidence/BUILD-issue-236-phase-1-frontend.log
```

**Store**: Complete terminal output (including timing + "Build succeeded" line)

**Required**:

- ✅ Zero build errors (status code 0)
- ✅ No warnings (or document if unavoidable)
- ✅ Both backend AND frontend passing

### 2. Test Output

**Capture**:

```bash
# Full suite (saves output + coverage JSON)
pnpm test 2>&1 | tee .claude/evidence/TESTS-issue-236-phase-1.log

# Extract coverage report
# Coverage metrics stored in browser output, convert to JSON:
pnpm test:cov
# Copy coverage/coverage-final.json → .claude/evidence/TESTS-issue-236-phase-1-coverage.json
```

**Store**: Complete test output + coverage JSON

**Required**:

- ✅ 100% of tests passing (zero failed tests)
- ✅ No skipped tests (❌ skip() is not acceptable)
- ✅ Coverage report captured (even if <80%)

**Extract Summary** (for friction-log):

```
Tests: 125/125 passed (100%)
Coverage: 78% statements, 71% branches, 85% functions
Duration: 45s
```

### 3. Type-Safety Checks

**Capture**:

```bash
# TypeScript compilation check
tsc --noEmit 2>&1 | tee .claude/evidence/TYPE-CHECK-issue-236-phase-1.log

# C# analysis (included in dotnet build, captured above)
# No separate step needed — build log contains Roslyn diagnostics
```

**Manual IDE Checks** (if relevant to task):

```bash
# Screenshot or note each check:
# 1. goToDefinition on function X → line Y ✅
# 2. findReferences on class Z → 5 usages ✅
# 3. No red squiggles in file F ✅
```

Store screenshot or checklist in .claude/evidence/TYPE-CHECK-issue-236-phase-1.txt

**Required**:

- ✅ Zero TypeScript errors
- ✅ Zero type warnings (or document if unavoidable)
- ✅ Manual IDE spot-checks on changed symbols

### 4. Regression Analysis

**Capture**:

```bash
# Before task (baseline)
pnpm test 2>&1 | grep -E "passed|failed|coverage" > /tmp/before.txt

# After task
pnpm test 2>&1 | grep -E "passed|failed|coverage" > /tmp/after.txt

# Diff
diff -u /tmp/before.txt /tmp/after.txt | tee .claude/evidence/REGRESSION-issue-236-phase-1.txt
```

**Store**: Before/after test summary diff

**Required**:

- ✅ No new test failures
- ✅ Coverage not decreased
- ✅ Same number of tests (no skipped tests added)

**Acceptable Changes**:

- ✅ More tests passing (new tests added)
- ✅ Coverage increased
- ✅ Performance improvements

---

## MANIFEST.json Structure

```json
{
  "task": "Issue #236 Phase 1 - Configuration Consolidation",
  "description": "Refactor CLAUDE.md + enhance AGENTS.md + audit settings.json",
  "completed": "2026-07-25T14:32:10Z",
  "duration_minutes": 120,
  "git_commit": "977a52b",
  "gate1": {
    "required": false,
    "reason": "Single-domain changes, <3 files affected per task"
  },
  "gate2": {
    "required": true,
    "status": "PASS",
    "evidence": {
      "build": {
        "backend": {
          "file": "BUILD-issue-236-phase-1.log",
          "status": "PASS",
          "timestamp": "2026-07-25T14:20:30Z"
        },
        "frontend": {
          "file": "BUILD-issue-236-phase-1-frontend.log",
          "status": "PASS",
          "timestamp": "2026-07-25T14:21:15Z"
        }
      },
      "tests": {
        "file": "TESTS-issue-236-phase-1.log",
        "status": "PASS",
        "summary": {
          "passed": 125,
          "failed": 0,
          "skipped": 0,
          "coverage_percent": 78
        },
        "coverage_json": "TESTS-issue-236-phase-1-coverage.json",
        "timestamp": "2026-07-25T14:22:00Z"
      },
      "type_safety": {
        "file": "TYPE-CHECK-issue-236-phase-1.log",
        "status": "PASS",
        "errors": 0,
        "warnings": 0,
        "manual_checks": [
          "goToDefinition on 3 changed functions ✅",
          "findReferences verified ✅",
          "No IDE errors ✅"
        ],
        "timestamp": "2026-07-25T14:23:00Z"
      },
      "regressions": {
        "file": "REGRESSION-issue-236-phase-1.txt",
        "status": "PASS",
        "analysis": "No regressions detected. All baseline tests still passing.",
        "timestamp": "2026-07-25T14:24:00Z"
      }
    }
  },
  "token_usage": {
    "start": 0,
    "end": 50000,
    "budget": 200000,
    "percent_used": 25
  },
  "friction_log_entry": ".claude/friction-log.md#2026-07-25-phase-1",
  "notes": "Clean phase with no blockers. YAML frontmatter approach approved.",
  "verified_by": "system"
}
```

---

## Validation Checklist

Before marking task complete, verify:

- [ ] MANIFEST.json created with all 4 evidence sections
- [ ] All evidence files present in .claude/evidence/
- [ ] All evidence files NOT empty (>0 bytes)
- [ ] Build log shows "Build succeeded" (backend) and "build succeeded" (frontend)
- [ ] Test output shows "X passed, 0 failed"
- [ ] Type-check log shows zero errors
- [ ] Regression diff shows no new failures
- [ ] Git commit hash documented in MANIFEST.json
- [ ] Friction-log entry created/updated
- [ ] Evidence artifacts committed to git

---

## Automated Validation (Harness)

Pre-commit hook validates:

```bash
# Check: Evidence directory has all required files
ls .claude/evidence/BUILD-*
ls .claude/evidence/TESTS-*
ls .claude/evidence/TYPE-CHECK-*
ls .claude/evidence/REGRESSION-*

# Check: MANIFEST.json exists and is valid JSON
jq . .claude/evidence/MANIFEST.json

# Check: All files are non-empty
find .claude/evidence -type f ! -size 0

# Check: Commit includes evidence reference
git show HEAD --format=%B | grep -i "evidence\|gate 2"
```

If any check fails: **BLOCK COMMIT** with message:

```
Error: Gate 2 evidence incomplete
Required files missing: .claude/evidence/REGRESSION-*.txt
Add evidence files before committing.
```

---

## Troubleshooting

### Issue: "Build succeeded but tests failed"

**Analysis**: Test failure after successful build indicates code logic error

**Action**:

1. Fix failing test or code
2. Re-run: `pnpm test` (capture new output)
3. Update evidence files
4. Retry Gate 2 validation

### Issue: "Type checks pass locally, fail in CI"

**Analysis**: Environment difference (Node/pnpm versions, globals, etc)

**Action**:

1. Verify local Node/pnpm versions match CI
2. Run: `pnpm install` (refresh node_modules)
3. Run: `tsc --noEmit` (recheck)
4. Capture fresh logs

### Issue: "Coverage decreased"

**Analysis**: New code paths added without test coverage

**Action**:

1. Review coverage report (coverage JSON)
2. Identify untested lines
3. Add tests for new code paths
4. Verify coverage increases back to baseline
5. Resubmit evidence

---

## Archiving Old Evidence

After task completes + merged to main:

```bash
# Archive old evidence (keep for 30 days)
mkdir -p .claude/evidence/archive
mv .claude/evidence/BUILD-* .claude/evidence/archive/
mv .claude/evidence/TESTS-* .claude/evidence/archive/
mv .claude/evidence/TYPE-CHECK-* .claude/evidence/archive/
mv .claude/evidence/REGRESSION-* .claude/evidence/archive/

# Update MANIFEST.json to reference archive location
# Commit archive

# After 30 days, delete archive (or move to separate branch)
```

---

## Related Documentation

- [TWO-GATE-SYSTEM.md](./TWO-GATE-SYSTEM.md) — Gate requirements
- [CONTEXT-MANAGEMENT.md](./CONTEXT-MANAGEMENT.md) — Context pressure + gates
- [friction-log-template.md](./friction-log-template.md) — Logging template
