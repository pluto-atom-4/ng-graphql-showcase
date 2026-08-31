# Multi-Agent Orchestration Governance

Operational rules for autonomous multi-agent loops. Prevent token wastage, ensure recovery from failures, and establish clear handovers between specialized agents.

---

## 1. Explicit Role Responsibilities

Do not let agents pick personas. Assign tasks to specific agent types.

### Architect/Planner Agent

**Definition:** `.claude/agents/architect.md` | **Model:** `inherit` — binds to the session model

**Responsibilities:**

- Read CLAUDE.md, DESIGN.md, SKILLS.md for guidance
- Establish current state via the GitHub API before planning — recent commits, open PRs, issue decisions. Without `Bash` there is no `git log`, and a planner blind to recent history re-plans finished work.
- Create/update `tasks.md` plan file
- Design implementation strategy
- Identify architectural risks + dependencies

**Forbidden:**

- ❌ Write production code files
- ❌ Modify implementation without human approval
- ❌ Execute shell commands (Bash, git, etc.) — enforced: `Bash` absent from `tools:`. The cost is git-history blindness; it is paid back via the GitHub API, not by granting shell.
- ❌ Modify test files

**Tools Allowed:**

- Read, Grep, Glob (all files, tests included)
- WebFetch (allowlisted domains only — see §3)
- `mcp__github__list_commits`, `issue_read`, `pull_request_read` — structured current-state reads
- `mcp__github__add_issue_comment` — the role's only outward write; blocking questions only (see §3)
- Write (tasks.md, .claude/agent_state.json only — convention, not machine-enforced)

An earlier revision forbade _reading_ test files while also granting "Read (all files)". The prohibition is dropped: existing test coverage is legitimate input to scoping, and `tools:` has no read-denylist to express it with. Only modification is forbidden.

**Escalation:** If planning exceeds 200 lines or identifies blockers → halt and report to human

---

### Coder Agent

**Definition:** `.claude/agents/coder.md` | **Model:** `haiku` (Haiku 4.5)

**Responsibilities:**

- Read tasks.md implementation steps
- Write/edit production code files
- Run local builds for verification
- Commit changes with detailed messages

**Forbidden:**

- ❌ Modify tasks.md plan without explicit human approval
- ❌ Change project structure/architecture
- ❌ Mock DbContext or break testing patterns
- ❌ Skip type checking or linting

**Tools Allowed:**

- Read (all project files)
- Edit/Write (src/, backend/, frontend/ only)
- Bash (dotnet, pnpm, git commands only)

**Escalation:** If target file doesn't exist or requires schema changes → stop, log error, request human guidance

---

### Reviewer/Tester Agent

**Definition:** `.claude/agents/reviewer.md` | **Model:** `haiku` (Haiku 4.5)

**Responsibilities:**

- Run build + test suite per CLAUDE.md
- Verify no regressions
- Report test coverage + performance metrics
- Validate against acceptance criteria

**Forbidden:**

- ❌ Modify production code
- ❌ Skip tests or lower thresholds
- ❌ Force-push or rewrite history
- ❌ Approve/merge PRs autonomously

**Tools Allowed:**

- Read (all files)
- Edit/Write (.test.ts, .test.cs, .spec.ts files only)
- Bash (dotnet test, pnpm test, git commands only)

**Escalation:** If test suite fails → capture logs, halt, report failure with context

---

## 2. Handover & Escalation Protocol

### Three-Strike Rule

**If agent encounters same error 3 times consecutively:**

1. Halt all operations immediately
2. Write execution log to `.claude/errors.log`
3. Dump current state to `.claude/agent_state.json`
4. Yield control back to human with:
   - Error type + count
   - Last attempted action
   - Suggested remediation

**Example:**

```
Error: "Type 'BuildId' not found"
Count: 3 consecutive attempts
Last Action: dotnet build
Suggested: Run 'dotnet clean' then retry
```

### State Locking

**Before spawning sub-agent:**

- Parent agent writes current state to `.claude/agent_state.json`
- Include: current task, completed steps, next steps, uncommitted changes
- Sub-agent reads state, validates context
- Sub-agent writes updated state before yielding

**State File Format:**

```json
{
  "timestamp": "2026-07-10T18:30:00Z",
  "parentAgent": "architect",
  "currentTask": "Implement migration-generator skill",
  "completedSteps": ["Read requirements", "Design API"],
  "nextStep": "Write CLI handler",
  "uncommittedChanges": ["SKILLS.md"],
  "blockers": null,
  "escalationNeeded": false
}
```

**Recovery:** If sub-agent crashes, parent reads `.claude/agent_state.json` and resumes from last saved state.

### Handover Checklist

Before spawning next agent:

- [ ] Current state written to `.claude/agent_state.json`
- [ ] All uncommitted changes staged or stashed
- [ ] Git log shows clean history (no merge conflicts)
- [ ] Next agent role + scope explicitly defined
- [ ] Success criteria documented in tasks.md

---

## 3. Bound Agent Permissions

### Network Access

**Only Architect/Planner Agent can:**

- Fetch external API documentation (`WebFetch`, allowlisted domains only)
- Query GitHub for commit, issue, and PR context (`github` MCP server)
- Post a blocking question to an issue or PR (`add_issue_comment`) — its only outward write

**All other agents:**

- ❌ No network access (work with cached docs only)

**Rationale:** Prevent agents from hallucinating or fetching stale API specs mid-implementation.

**Status:** Implemented. The Architect holds `WebFetch` in its `tools:` list; Coder and Reviewer hold no network tools, so the exclusivity is enforced by the harness on both sides.

`WebSearch` is granted to no role. The Architect fetches URLs it already knows; open-ended search is not domain-scoped and would weaken the allowlist as a boundary.

Allowed `WebFetch` domains (`.claude/settings.json`):

| Domain                  | Covers                    |
| ----------------------- | ------------------------- |
| `docs.elsaworkflows.io` | Elsa Workflows v3         |
| `api.github.com`        | Issue and PR context      |
| `angular.dev`           | Angular                   |
| `chillicream.com`       | Hot Chocolate GraphQL     |
| `learn.microsoft.com`   | .NET, EF Core, SQL Server |

Per the Claude Code documentation, settings permissions apply to a subagent's tool calls exactly as they do to the main session — subagents are not evaluated separately. The allowlist is therefore a real boundary on the Architect, not an honour-system convention, and a fetch outside it is denied.

**Unreachable source:** the Architect records it in `tasks.md` as an explicit assumption — the URL, and what was assumed without it — then continues. It does not halt for a single lookup.

### GitHub MCP Server

Configured in `.mcp.json` as a remote HTTP server (`https://api.githubcopilot.com/mcp/`). The Architect is the only role granted it.

Two independent layers bound what it can do, because one is not enough:

| Layer          | Mechanism                           | Effect                                                                         |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| Tool allowlist | `tools:` names four exact MCP tools | A tool not named is unreachable — including any the upstream server adds later |
| Token scope    | Fine-grained PAT                    | Even a reachable tool fails if the token cannot perform it                     |

Granted: `list_commits`, `issue_read`, `pull_request_read` (reads), and `add_issue_comment` (the single write).

Withheld by omission: `merge_pull_request`, `push_files`, `create_branch`, `issue_write` — no merging, pushing, branch creation, or closing and editing issues. Because `tools:` is an allowlist rather than a denylist, a destructive tool added upstream is not silently inherited.

**Commenting is for blocking questions only** — ambiguity that stops the plan, a constraint conflict, an assumption needing confirmation before the Coder acts. Not status updates, not the plan itself, not approvals or sign-offs. The Architect asks, then halts and yields; it does not post and carry on as though answered.

Rationale: the escalation duty in §1 was unreachable in practice. A question raised only in `tasks.md` has no audience — nobody is subscribed to a file. A comment on the issue reaches the human who has to answer it.

**Token setup.** `.mcp.json` reads `${GITHUB_MCP_PAT}` from the environment; the file is committed, the token never is. Use a fine-grained PAT scoped to this repository alone, with `Issues: Read and write` and `Pull requests: Read and write`, and `Contents` at read-only or none. Contents write would re-open the push path that withholding `Bash` closed.

The value must be in the **process environment** of the shell that launches Claude Code. `${VAR}` expansion does not read `.env.local` — putting it there alone leaves the server unauthenticated, and `claude mcp list` reports `Missing environment variables: GITHUB_MCP_PAT`. Either export it from your shell profile, or source the file from there:

```bash
# ~/.zshrc — .env.local stays gitignored, the token stays out of the repo
set -a; [ -f /path/to/ng-graphql-playground/.env.local ] && . /path/to/ng-graphql-playground/.env.local; set +a
```

Do not put the token in `.claude/settings.local.json`. It is gitignored, but the `env` block is not a secret store, and the repo's own security rule forbids secrets in settings files.

**First run needs approval.** A project `.mcp.json` server starts as `⏸ Pending approval`. Launch `claude` interactively once and approve it; `claude mcp list` then reports health instead.

### File System Boundaries

| Agent     | Read | Write                      | Scope               | Model                     |
| --------- | ---- | -------------------------- | ------------------- | ------------------------- |
| Architect | All  | tasks.md, agent_state.json | Planning only       | `inherit` (session model) |
| Coder     | All  | src/, backend/, frontend/  | Implementation only | `haiku`                   |
| Reviewer  | All  | .test.ts, .spec.ts         | Testing only        | `haiku`                   |

**Enforcement:** `writeScope` is **not** a settings key and is not machine-enforced. Tool access comes from the `tools:` frontmatter in `.claude/agents/<role>.md`; path limits are instructions in the agent prompt body plus the PreToolUse hooks in `.claude/settings.json`.

### Bash Command Boundaries

| Command Type   | Architect | Coder           | Reviewer               |
| -------------- | --------- | --------------- | ---------------------- |
| `dotnet build` | ❌        | ✅              | ✅                     |
| `dotnet test`  | ❌        | ✅ (local only) | ✅                     |
| `pnpm codegen` | ❌        | ✅              | ❌                     |
| `git push`     | ❌        | ❌              | ❌ (requires approval) |
| `git commit`   | ❌        | ✅              | ❌                     |

---

## 4. Error Recovery & Escalation Triggers

### Escalation Conditions

**Halt + Report if:**

| Condition              | Agent     | Action                                     |
| ---------------------- | --------- | ------------------------------------------ |
| Same error 3 times     | Any       | Write `.claude/errors.log`, yield to human |
| File doesn't exist     | Coder     | Stop, request human guidance               |
| Test suite fails       | Reviewer  | Log failures, halt merge                   |
| Ambiguous requirements | Architect | Flag in tasks.md, request clarification    |
| Network timeout        | Planner   | Retry 2x, then use cached docs             |
| Merge conflict         | Coder     | Halt, request human intervention           |
| Permission denied      | Any       | Log error, yield control                   |

### Error Log Format

**`.claude/errors.log`** (append-only):

```
[2026-07-10T18:35:20Z] Coder Agent
Error: MSB1003: Specify a project or solution file
Attempts: 3
Context: Trying to build ./backend/
Last Command: dotnet build ./backend/
Suggested Fix: Run from FactoryApp.WebApi directory
---
```

---

## 5. Configuration Enforcement

### `.claude/agents/<role>.md` Definitions

Roles are defined as agent files, not as a settings key. There is no `agentOrchestration` field in the Claude Code settings schema; an earlier version of this document described one that never existed.

Each role file carries YAML frontmatter:

```yaml
---
name: coder
description: >
  Implementation agent for the Coder role. Reads tasks.md, writes production
  code under src/, backend/, frontend/, runs builds, commits on a feature branch.
tools: [Read, Edit, Write, Grep, Glob, Bash]
model: haiku
---
```

| Field         | Enforced by                           | Notes                                                              |
| ------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `tools`       | Harness (hard)                        | Agent cannot call a tool outside this list                         |
| `model`       | Harness (hard)                        | Overrides session model; omit to inherit from parent               |
| Write paths   | Prompt body + PreToolUse hooks        | Soft — frontmatter has no `writeScope` equivalent                  |
| Bash commands | Prompt body + PreToolUse hooks        | Soft — `.claude/settings.json:55-64` blocks high-risk only         |
| Fetch domains | `permissions.allow` (hard)            | Settings permissions apply to subagents, not just the main session |
| MCP tools     | `tools:` allowlist + PAT scope (hard) | Unnamed tools unreachable; token scope backstops the ones that are |

**Current roster:**

| File                          | Role      | Model     | Status        |
| ----------------------------- | --------- | --------- | ------------- |
| `.claude/agents/coder.md`     | Coder     | `haiku`   | ✅ Executable |
| `.claude/agents/reviewer.md`  | Reviewer  | `haiku`   | ✅ Executable |
| `.claude/agents/architect.md` | Architect | `inherit` | ✅ Executable |

Model precedence, highest first: `model` param on the spawn call → agent frontmatter `model:` → `CLAUDE_CODE_SUBAGENT_MODEL` env var (unset here) → the main conversation's model (`claude-opus-5` per `.claude/settings.json:26`).

`model: inherit` is not the same as omitting the key. `inherit` binds explicitly to the main conversation's model, skipping the env var; omitting `model:` runs the normal resolution order, so `CLAUDE_CODE_SUBAGENT_MODEL` would win if anyone set it. The Architect sets `inherit` deliberately — its planning depth should track the session, not an environment variable.

### Compliance Checks

Before each agent operation:

1. Verify agent role matches task type
2. Check file path against the write scope in the agent's prompt body
3. Validate Bash command against restrictions
4. Read `.claude/agent_state.json` for context recovery

Steps 2 and 3 are conventions the agent follows, not gates the harness applies. Only the PreToolUse hooks in `.claude/settings.json` deny at the tool-call boundary.

---

## 6. Multi-Agent Loop Example

**Scenario:** Implement new feature (PR review + merge)

### Step 1: Architect Phase

```
Agent: Planner
Task: Design implementation
Output: tasks.md with steps
State: Write to .claude/agent_state.json
Result: ✅ Plan approved by human
```

### Step 2: Coder Phase

```
Agent: Coder
Input: Read tasks.md + agent_state.json
Task: Implement feature
Commands: dotnet build, git commit
Output: Feature branch ready
State: Update .claude/agent_state.json
Result: Code written + local tests pass
```

### Step 3: Reviewer Phase

```
Agent: Reviewer
Input: Read feature branch + agent_state.json
Task: Run full test suite
Commands: pnpm test, dotnet test
Output: Test report + coverage metrics
State: Final state in .claude/agent_state.json
Result: ✅ All tests pass or ❌ Halt + report failures
```

### Error Scenario: Three-Strike Halt

```
Coder tries to run 'dotnet build' 3 times
Each fails: "Type 'BuildId' not found"
Action: Write to .claude/errors.log
Halt execution
Human reviews error + provides fix
Coder resumes from last known state
```

---

## 7. Maintenance & Auditing

### Monthly Review Checklist

- [ ] Review `.claude/errors.log` for patterns
- [ ] Check `.claude/agent_state.json` for stale entries (cleanup)
- [ ] Audit `.claude/settings.json` role definitions
- [ ] Verify handover checklist is followed
- [ ] Test error recovery (simulate failure + validate recovery)

### Metrics to Track

| Metric                 | Target   | Purpose                     |
| ---------------------- | -------- | --------------------------- |
| Avg errors per task    | <2       | Lower = better agent design |
| 3-strike halts         | <1/month | Track systemic issues       |
| State recovery success | 100%     | Validate handover protocol  |
| Agent role adherence   | 100%     | Catch permission violations |

---

## 8. Quick Reference

### When Spawning a Sub-Agent

✅ Do:

- Write current state to `.claude/agent_state.json`
- Define role + scope explicitly
- Provide acceptance criteria
- Include relevant file paths

❌ Don't:

- Let agent pick its own role
- Skip state saving
- Use vague success criteria
- Spawn without human approval

### When Agent Halts

✅ Do:

- Write error to `.claude/errors.log`
- Preserve `.claude/agent_state.json` for recovery
- Report failure with context to human
- Await human decision

❌ Don't:

- Force retry without fixing root cause
- Delete logs or state files
- Continue without explicit approval
- Suppress errors

---

## Related Files

- **CLAUDE.md** — Core behavior rules + quick ref
- **AGENTS.md** — Agent onboarding + guardrails
- **SKILLS.md** — Procedural workflow automation index
- **.claude/settings.json** — Orchestration config (permissions, roles, constraints)
- **.claude/friction-log.md** — Maintenance log for configuration updates
