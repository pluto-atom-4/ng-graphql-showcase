# Two-Gate System: Evidence-Based Execution

**Version:** 1.0.0 | **Updated:** 2026-07-25

Enforcement mechanism for task quality: Gate 1 (planning) + Gate 2 (verification).

**No task is complete until both gates pass.**

---

## Gate 1: Plan Mode (Before Code)

**Requirement**: Before editing 3+ files OR cross-domain changes, enter Plan Mode.

### When Gate 1 Applies

- ✅ Multi-file refactors (3+ files)
- ✅ Cross-domain changes (backend + frontend in same task)
- ✅ Architectural changes (new patterns, new abstractions)
- ✅ Schema or type changes (domain model updates)

### When Gate 1 Does NOT Apply

- ❌ Single file edits (under 3 files)
- ❌ Bug fixes in isolated functions
- ❌ Comment/documentation updates
- ❌ Test-only changes

### Execution

```
User or system trigger: /plan
→ Enter Plan Mode (read-only context)
→ Load and review tasks.md
→ Document task dependencies
→ Identify risk points
→ User reviews and approves
→ Exit with: /plan-execute
→ Code edits now allowed
```

### Approval Checklist

Before user approves Gate 1:

- [ ] Task tree reviewed (tasks.md)
- [ ] Dependencies documented (what other tasks block this?)
- [ ] Risk points identified (where could this break?)
- [ ] Rollback plan documented (if things go wrong)
- [ ] Scope confirmed (which files, which modules)

### Failure Action

If Gate 1 rejected:

1. Rewind to checkpoint (git stash save)
2. Revise task dependencies
3. Re-submit for Gate 1 approval

---

## Gate 2: Evidence Verification (Before Task Complete)

**Requirement**: Task only marked COMPLETE after all evidence checks pass.

### Evidence Checklist

Before marking task complete, verify ALL of:

#### ✅ Build Logs Pass

```bash
# Backend build
dotnet build ./backend/FactoryApp.slnx
# Expected: "Build succeeded."

# Frontend build
pnpm build
# Expected: No build errors

# Both passing required
```

**Store**: Capture build output in task comment or `.claude/evidence/BUILD-<task-id>.log`

#### ✅ All Tests Pass

```bash
# Full test suite
pnpm test

# Or specific suite (if task-scoped)
pnpm test:backend
pnpm test:frontend
```

**Store**: Capture test output in `.claude/evidence/TESTS-<task-id>.log`

**Requirement**: 100% of tests must pass. No skipped tests.

#### ✅ Type-Safety Verification (LSP Checks)

Verify type-safety on all changed symbols:

```bash
# TypeScript: tsc --noEmit
tsc --noEmit

# C#: dotnet build (includes roslyn analysis)
# (already captured in Build Logs)
```

**IDE Checks** (manual, only if relevant):

- [ ] goToDefinition works on changed symbols
- [ ] findReferences finds all usages
- [ ] No red squiggles in IDE

**Store**: Screenshot or note in task comment

#### ✅ No Regressions (Diff Old vs New)

Compare test outputs before/after:

```bash
# After task completion:
# 1. Capture test summary (passed count, failed count, coverage)
# 2. Compare to baseline (previous test run summary)
# 3. Verify: no new failures, no coverage regression
```

**Acceptable**:

- ✅ Same tests passing
- ✅ New tests added + all passing
- ✅ Coverage increased

**Unacceptable**:

- ❌ Tests now failing that passed before
- ❌ Coverage decreased
- ❌ Flaky test introduced

**Store**: Diff in task comment or `.claude/evidence/REGRESSION-<task-id>.txt`

---

## Gate 2 Verification Template

Use this template for every task completion:

```markdown
## Gate 2: Evidence Verification

### Build Logs ✅

- [x] `dotnet build` succeeded
- [x] `pnpm build` succeeded
- Build output: [link or summary]

### Tests ✅

- [x] `pnpm test` 100% passing
- Tests run: 125/125 passed
- Coverage: 78% (↑2% from baseline)
- Test output: [link or summary]

### Type-Safety ✅

- [x] `tsc --noEmit` passed
- [x] No type errors in changed symbols
- [x] goToDefinition verified on 3 changed functions
- Type check log: [link or summary]

### Regressions ✅

- [x] No new test failures
- [x] No coverage regression
- [x] Behavior unchanged for existing code paths
- Diff: [link to before/after summary]

---

**Gate 2 Status**: ✅ PASS — Task ready for merge
```

---

## Storage: Evidence Artifacts

**Location**: `.claude/evidence/`

### Directory Structure

```
.claude/evidence/
├── BUILD-issue-236-phase-1.log         (dotnet build output)
├── TESTS-issue-236-phase-1.log         (pnpm test output)
├── TYPE-CHECK-issue-236-phase-1.log    (tsc output)
├── REGRESSION-issue-236-phase-1.txt    (before/after diff)
├── MANIFEST.json                       (index of all evidence)
└── ...
```

### Manifest Format

```json
{
  "task": "Issue #236 Phase 1",
  "completed": "2026-07-25T14:32:10Z",
  "evidence": {
    "build": "BUILD-issue-236-phase-1.log",
    "tests": "TESTS-issue-236-phase-1.log",
    "type_safety": "TYPE-CHECK-issue-236-phase-1.log",
    "regressions": "REGRESSION-issue-236-phase-1.txt"
  },
  "gate1_approved_by": "user",
  "gate2_verified_by": "system",
  "git_commit": "977a52b"
}
```

---

## Friction Log Integration

Auto-log evidence to `.claude/friction-log.md`:

```markdown
## 2026-07-25 — Issue #236 Phase 1 — GATE 2 PASS ✅

**Build**: ✅ dotnet build + pnpm build (0 errors)
**Tests**: ✅ 125/125 passing (78% coverage)
**Type-Safety**: ✅ tsc --noEmit + 3 manual symbol checks
**Regressions**: ✅ No coverage regression, all tests stable

**Evidence**: `.claude/evidence/MANIFEST.json`
**Commit**: 977a52b
**Elapsed**: 45 min (Phase 1 + Phase 2)
```

---

## Enforcement: Block PR Without Gates

**Pre-commit hook** (enforced by harness):

```bash
# Before git commit -m "feat: ..."
# 1. Check: Was Gate 1 required? If yes, was it approved?
# 2. Check: Does commit message include Gate 2 evidence?
# 3. If either missing: BLOCK commit
```

**Pre-push hook** (enforced by harness):

```bash
# Before git push
# 1. Verify: Commit includes Gate 2 checklist
# 2. Verify: Evidence artifacts logged
# 3. If missing: BLOCK push to main
```

**GitHub PR Checks** (CI/CD):

```bash
# On PR creation to main:
# 1. Lint: Evidence artifacts present in .claude/evidence/
# 2. Validate: Manifest.json well-formed
# 3. Require: Tests must pass in CI
# 4. Require: Build logs in PR body
```

---

## Gate Waiver (Emergency Only)

**Condition**: Task is blocking production incident

**Waiver Process**:

1. Communicate why gates are blocked (specific reason)
2. Document risk (what could break without full verification)
3. Plan recovery (how to verify post-deployment)
4. User explicitly approves: "waive gates for <task>, risk acknowledged"
5. Log waiver in friction-log.md with timestamp + reason

**Waived gates must be verified within 24 hours post-deployment.**

---

## Best Practices

✅ **Do**:

- Verify build + tests locally before committing
- Capture evidence early (don't wait until task-end)
- Use Gate 2 template for consistency
- Document risk points during Gate 1
- Review friction-log for patterns

❌ **Don't**:

- Skip Gate 1 for "quick" multi-file changes
- Commit without capturing build/test logs
- Merge to main with failing tests
- Ignore type errors ("will fix later")
- Leave evidence artifacts uncommitted

---

## Related Documentation

- [CLAUDE.md](./CLAUDE.md) — Execution framework
- [CONTEXT-MANAGEMENT.md](./.claude/CONTEXT-MANAGEMENT.md) — Gate overview
- [.claude/rules/](./rules/) — Domain patterns
