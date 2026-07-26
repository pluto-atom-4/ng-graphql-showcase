# Friction Log Template

Use this template to track token usage, decisions, and error patterns. Update `.claude/friction-log.md` manually or auto-log via harness.

---

## Session Header

```markdown
# Friction Log

**Start Date**: 2026-07-25  
**Session ID**: d3a97052  
**Project**: Issue #236 - Optimize AI Tools Configuration  
**Status**: In Progress (Phase 2/3)
```

---

## Entry Template

```markdown
## YYYY-MM-DD — [Task Name] — [STATUS]

**Time**: HH:MM–HH:MM (elapsed time)  
**Tokens**: X,XXX / 200,000 (XX% usage)  
**Phase**: Phase 1 Configuration Consolidation

### Work Completed

- [x] CLAUDE.md refactored (98 lines)
- [x] AGENTS.md skill discovery added
- [x] .claude/settings.json hooks configured

### Decisions Made

**Decision 1: YAML Frontmatter in Copilot Instructions**

- **Rationale**: Enable machine-parsing for glob-based scoping
- **Alternative**: Plain markdown + external config
- **Token Cost**: 2,000 tokens (documentation)
- **Risk**: None (backwards-compatible)
- **Benefit**: Cross-CLI compatibility (Claude Code + Copilot CLI)
- **Status**: ✅ APPROVED

### Errors/Blockers

None encountered.

### Test Results

- ✅ Build logs: Config JSON validates against schema
- ✅ Type-safety: No TypeScript errors
- ✅ Regressions: None detected
- Coverage: N/A (documentation-only changes)

### Gate Status

- **Gate 1** (Plan Mode): N/A (single-domain changes)
- **Gate 2** (Evidence): ✅ PASS
  - Build: ✅ Configuration valid
  - Tests: ✅ No regressions
  - Type-safety: ✅ JSON schema valid

### Metrics

| Metric        | Value   | Trend             |
| ------------- | ------- | ----------------- |
| Token Usage   | 50,000  | ↑ (25% of budget) |
| Task Duration | 120 min | ↓ (efficient)     |
| Errors        | 0       | ↓ (clean)         |
| Files Changed | 4       | ↑ (Phase 1 scope) |

### Reflection / Retrospective

**What Went Well**:

- Clean separation of concerns (CLAUDE.md vs AGENTS.md)
- Structured frontmatter approach resonates with both CLIs
- Hook system extensible for future phases

**What Was Tricky**:

- YAML frontmatter adoption across both CLI ecosystems
- Balancing machine-parseable vs human-readable

**What to Improve Next**:

- Allocate more time for PostToolUse hook testing (Phase 2)
- Document discovery triggers with more user examples

### Next Steps

1. Phase 2 (Tool Integration): 2.5 days
   - PreToolUse/PostToolUse hooks
   - Context mgmt directives
   - Skill discovery framework

2. Phase 3 (Evidence-Based Execution): 2 days
   - Two-Gate system enforcement
   - Token tracking automation
   - Evidence artifact collection

---
```

## Quick-Log Template (Mid-Task)

Use this for quick updates during active work:

```markdown
## 2026-07-25 14:45 — Skill Discovery Framework — ⏳ IN PROGRESS

**Tokens**: 75,000 / 200,000 (37% usage)

**Current Work**:

- Creating .claude/skills/INDEX.md (skill discovery mechanism)
- Writing .claude/skills/SKILL-TEMPLATE.md

**Blocker**: None

**ETA**: 30 min (complete framework + commit)
```

## Summary Template (End of Phase)

Use at end of each phase:

```markdown
# Phase Summary — Phase 2: Tool Integration

**Duration**: 2.5 days (wall-clock time)  
**Token Usage**: 120,000 (60% of budget)  
**Commits**: 2 (e064e07 main commit)

## Deliverables

| Item              | Status      | Notes                             |
| ----------------- | ----------- | --------------------------------- |
| PreToolUse Hooks  | ✅ Complete | Destructive command blocking      |
| PostToolUse Hooks | ✅ Complete | Auto-lint/format on save          |
| Context Mgmt Docs | ✅ Complete | 255 lines (CONTEXT-MANAGEMENT.md) |
| Skill Discovery   | ✅ Complete | Framework + 4 discoverable skills |

## Metrics

- **Lines added**: 1,200 (documentation + config)
- **Files created**: 4 (.claude/hooks/, .claude/skills/, CONTEXT-MANAGEMENT.md)
- **Files modified**: 2 (AGENTS.md, settings.json)
- **Tests added**: 0 (infrastructure, no user-facing changes)
- **Test failures**: 0
- **Build regressions**: 0

## Risk Assessment

- ✅ **Production readiness**: HIGH (no product code changes, only config/docs)
- ✅ **Breaking changes**: NONE
- ✅ **Dependency bloat**: NONE (only documentation)
- ⚠️ **Hook system maturity**: BETA (framework ready, usage patterns TBD in Phase 3)

## Lessons Learned

1. **Success**: Documenting hook system alongside implementation improves clarity
2. **Success**: YAML frontmatter + skill discovery aligns with agent expectations
3. **Opportunity**: Phase 3 should validate hooks in real scenarios

## Forward Planning

- Phase 3: Implement Two-Gate enforcement (pre-commit/pre-push hooks)
- Consider: Auto-discovery tests (verify skill triggers work as documented)
- Backlog: Add friction-log automation (harness-native logging)

---
```

## Friction-Log Best Practices

✅ **Do**:

- Update at phase boundaries (every 2-4 hours)
- Document surprising decisions (why not obvious path)
- Note token pressure milestones (50%, 75%, 90%)
- Capture metrics (files changed, tests run, duration)
- Reflect on tradeoffs

❌ **Don't**:

- Update every commit (too noisy)
- Log routine edits ("added comment", "fixed typo")
- Store sensitive data (tokens, credentials)
- Leave uncommitted log entries

## Reading the Friction Log

**For Auditing** (did we spend tokens efficiently?):

- Sort by Token Usage column
- Identify high-cost decisions
- Review rationale for expensive phases

**For Learning** (what patterns work?):

- Read "Lessons Learned" sections
- Note successful approaches
- Track how issues were resolved

**For Recovery** (what happened before crash?):

- Find last Gate 2 PASS entry
- Check git commit hash
- Use that as rollback point
