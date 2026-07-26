# Context Management Directives

**Version:** 1.0.0 | **Updated:** 2026-07-25

Directives for managing token usage, state recovery, and execution gates during long conversations.

## Automatic Triggers (Harness-Managed)

### 1. Compact at 50% Token Usage

**Trigger**: Automatic when token usage reaches 50% of budget

**Action**:

- Harness invokes `/compact` skill automatically
- Summarizes conversation state
- Compresses long transcripts
- Continues with compressed context

**User can also trigger manually**:

```
/compact
```

**Output**: Summary markdown file in `.claude/compaction-history/`

### 2. Rewind on Agent Confusion

**Trigger**: Automatic on 3 consecutive tool errors OR user-initiated

**Action**:

- Revert to last known-good state (git stash save)
- Load previous context from `.claude/agent_state.json`
- Resume from task checkpoint

**User trigger**:

```
/rewind
```

**Checkpoint storage**: `.claude/agent_state.json` (auto-updated after each major task)

### 3. Plan Mode for Multi-File Edits

**Trigger**: Automatic before 3+ file edits OR user enters Plan Mode

**Action**:

- Enter `/plan` mode (read-only)
- Review task tree in `tasks.md`
- Document dependencies
- User approves plan
- Exit plan mode to execute

**User trigger**:

```
/plan
```

Then when ready:

```
/plan-execute
```

## Manual Directives

### /compact

Summarize and compress conversation state when token usage is high.

**Usage**:

```
/compact
```

**Outputs**:

- `.claude/compaction-history/YYYY-MM-DD-HH-MM-SS.md` (summary)
- Continues with compressed context in next message

**When to use**:

- Proactively when working on long tasks
- After multi-file refactors
- Before starting new major phase

### /rewind

Restart from last known-good state. Undo recent changes if session drifted.

**Usage**:

```
/rewind
```

**Restores**:

- Git state from last stash
- Agent state from `.claude/agent_state.json`
- Task checkpoint

**When to use**:

- Agent made 3+ consecutive errors
- State became ambiguous
- Wrong direction taken (revert and restart)

**Caution**: Loses uncommitted work since last checkpoint.

### /plan

Enter Plan Mode for reviewing task structure before execution.

**Usage**:

```
/plan
```

**Requires approval** to proceed. Harness blocks code edits until approval.

**Exit**:

```
/plan-execute
```

## Gate System

### Gate 1: Plan Mode (Before Code)

**Required before**:

- Multi-file refactors (3+ files)
- Cross-domain changes (backend + frontend)
- Architectural changes

**Checklist**:

- [ ] Review task tree in `tasks.md`
- [ ] Document dependencies
- [ ] Identify risk points
- [ ] User approves

### Gate 2: Evidence Verification (Before Complete)

**Required before task completion**:

- ✅ Build logs pass (`dotnet build` + `pnpm build`)
- ✅ Tests pass (`pnpm test`)
- ✅ LSP checks pass (type-safety verification)
- ✅ No regressions (diff old/new test output)

## Context Pressure Levels

| Level       | Tokens | Action                                  |
| ----------- | ------ | --------------------------------------- |
| 🟢 Green    | 0-50%  | Normal operation                        |
| 🟡 Yellow   | 50-75% | Auto-invoke `/compact`                  |
| 🔴 Red      | 75-95% | Suggest `/compact` + final actions only |
| ⚫ Critical | >95%   | Only commit/summarize, no new work      |

## State Files

### `.claude/agent_state.json`

Tracks current execution state for recovery.

```json
{
  "session_id": "d3a97052",
  "phase": "Phase 2: Tool Integration",
  "task": "Create hook system",
  "checkpoint": "hooks/README.md created",
  "timestamp": "2026-07-25T14:32:10Z",
  "git_commit": "977a52b",
  "last_error": null,
  "consecutive_errors": 0
}
```

Auto-updated after each major task. Used by `/rewind` for recovery.

### `.claude/compaction-history/`

Stores compressed context snapshots.

```
.claude/compaction-history/
├── 2026-07-25-14-30-00.md  (Phase 1 complete)
├── 2026-07-25-14-45-00.md  (Phase 2 midpoint)
└── ...
```

Each file includes:

- Summary of completed work
- Remaining tasks
- Current file state
- Next steps

## Friction Log

**Location**: `.claude/friction-log.md`

Tracks token usage, error patterns, and decision points for auditing.

```markdown
## 2026-07-25 — Phase 1 Configuration

- Token usage: 50,000 / 200,000 (25%)
- Tasks completed: 4/4 (CLAUDE.md, AGENTS.md, settings.json, copilot-instructions)
- Errors: 0
- Major decisions: YAML frontmatter added to copilot-instructions.md

## Decision: YAML Frontmatter in Copilot Instructions

**Rationale**: Enable machine-parsing for glob-based scoping
**Token cost**: 2,000 (documentation + examples)
**Risk**: None (backwards-compatible)
**Benefit**: Cross-CLI compatibility (Claude Code + Copilot CLI)
```

Updated manually or auto-logged by harness.

## Best Practices

✅ **Do**:

- Use `/compact` after complex refactors
- Check token usage proactively
- Document decisions in friction-log
- Enter `/plan` for multi-file changes
- Run both gates before task completion

❌ **Don't**:

- Ignore yellow/red pressure indicators
- Skip Gate 1 for multi-file edits
- Rewind without reviewing changes
- Leave state files uncommitted
- Plan without reviewing dependencies

## Related Documentation

- [CLAUDE.md](./CLAUDE.md) — Execution framework
- [AGENTS.md](./AGENTS.md) — Agent guardrails
- [.claude/rules/](./rules/) — Domain patterns
