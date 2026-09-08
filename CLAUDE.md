# CLAUDE.md — AI Execution Framework

**Version:** 3.5.0 | **Last Updated:** 2026-09-07  
**Canonical Sources:** [AGENTS.md](./AGENTS.md) (agent schema) | [SKILLS.md](./SKILLS.md) (skill discovery) | [.claude/rules/](./.claude/rules/) (patterns) | [.claude/skills/INDEX.md](./.claude/skills/INDEX.md) (skill metadata)

---

## August 2026 Best Practices

**Context Engineering Principles** (Anthropic): Dense, precise instructions minimize token waste and maximize code-generation accuracy.

- **Avoid Articles & Filler**: Drop "the", "a", "just", "simply" in critical sections. Fragments OK for clarity.
- **Model Version Alignment**: Default to Claude Opus 5 (latest capability), Sonnet 5 (speed), Haiku 4.5 (cost).
- **Skill Auto-Discovery**: Use `.claude/skills/INDEX.md` keyword mapping to reduce manual skill invocation.
- **Token Budget Awareness**:
  - **50% usage**: Run `/compact` → summarize + compress context
  - **75% usage**: Run `/rewind` → restart from last known good state
  - **Max thinking tokens**: Adaptive; use `MAX_THINKING_TOKENS` env var per task complexity
- **Two-Gate Validation**: Plan Mode (architecture) → Execution (verification) prevents rework.
- **Evidence Artifacts**: All claims backed by measurable data (test output, performance profiles, security scans).

See [Anthropic Context Engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) for full guide.

---

## Stack & Pipeline

**Full-stack**: Angular 19 | Hot Chocolate GraphQL | ASP.NET Core .NET 10 | Elsa v3.5.3 | SQL Server | EF Core + Dapper

| Trigger                | Action                                   | Why                                 |
| ---------------------- | ---------------------------------------- | ----------------------------------- |
| Domain model change    | `dotnet build ./backend/FactoryApp.slnx` | Emits schema.graphql auto           |
| schema.graphql changes | `pnpm codegen`                           | Regenerate graphql.ts (type-safety) |
| Before PR submit       | `pnpm build && pnpm test`                | Validate integration                |

---

## Architectural Constraints (PR Blockers)

**Do not bypass. Evidence in .claude/rules/.**

| Rule                        | Action                                      | Evidence                                                                        |
| --------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------- |
| EF Core + Dapper in same op | Share explicit `DbTransaction`              | [database-rules.md#shared-transaction-rule](./.claude/rules/database-rules.md)  |
| GraphQL resolvers           | Return DTOs, never raw entities             | [graphql-patterns.md#entity-exposure-rule](./.claude/rules/graphql-patterns.md) |
| GraphQL query depth         | ≤5 layers; split deeper → separate requests | [graphql-patterns.md#query-depth-limit](./.claude/rules/graphql-patterns.md)    |
| `*ngFor` loops              | Mandatory `trackBy` function                | [frontend-patterns.md#ngfor-with-trackby](./.claude/rules/frontend-patterns.md) |
| schema.graphql, graphql.ts  | Never edit manually                         | [graphql-patterns.md#generated-files](./.claude/rules/graphql-patterns.md)      |

---

## Evidence-Based Execution (Two-Gate System)

**Gate 1: Plan Mode** (Before code)

- Enter Plan Mode before multi-file edits
- Review task tree in `.claude/plans/`
- Document dependencies and execution order
- Estimate effort; identify critical files and risk mitigations

**Gate 2: Verification** (Before task complete)

| Checkpoint      | Command                                                    | Pass Criteria                             |
| --------------- | ---------------------------------------------------------- | ----------------------------------------- |
| **Build**       | `dotnet build ./backend/FactoryApp.slnx && pnpm build`     | Exit code 0, no warnings                  |
| **Tests**       | `pnpm test`                                                | 100% pass rate (backend + frontend)       |
| **Type Safety** | LSP: `goToDefinition`, `findReferences` on changed symbols | All definitions found, no red squiggles   |
| **Regressions** | `git diff <base-branch> -- test/`                          | Output matches expected (no new failures) |

**Block Task Completion** if either gate fails. No PRs without both gates passing.

See [.claude/TWO-GATE-SYSTEM.md](./.claude/TWO-GATE-SYSTEM.md) for detailed gate criteria and evidence collection.

---

## Context Management (Token Pressure)

- **50% usage**: Run `/compact` — summarize + compress state
- **Agent confusion**: Run `/rewind` — restart from last known good
- **Long edits**: Enter Plan Mode → review dependencies → execute with Gate 2 checks

---

## Skill Discovery

See [SKILLS.md](./SKILLS.md) for canonical skill discovery mechanism, auto-invocation workflow, and metadata schema. Trigger keywords auto-discovered from `.claude/skills/<name>/SKILL.md` YAML frontmatter.

---

## Graph Intelligence & Routing Engine (Issues #300, #303)

Optional, not a prerequisite. Two graph engines, both registered as project MCP servers in [.mcp.json](./.mcp.json):

| Engine                                                | Binary                    | Scope                                  | Store                                                          |
| ----------------------------------------------------- | ------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| `code-review-graph` v2.3.8 (PyPI `code-review-graph`) | `code-review-graph serve` | Micro: AST, call graph, blast radius   | `<repo>/.code-review-graph/graph.db` (SQLite, self-gitignored) |
| `graphify` v0.9.56 (PyPI `graphifyy`)                 | `graphify-mcp`            | Macro: architecture, docs, communities | `graphify-out/graph.json` + `GRAPH_REPORT.md`                  |

Both auto-locate their store from the git root — no env var needed. `code-review-graph` must run inside a git repo; it hard-crashes outside one. Relocate its DB only via `--data-dir` / `CRG_DATA_DIR` (there is **no** `CRG_DATABASE_PATH` env var). Neither engine overrides Architectural Constraints or the Two-Gate System.

### Routing Matrix

Match prompt intent before wide `Grep`/`Glob`:

| Intent                                                                                   | Engine                | Entry points                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Explain the design", "where is feature X", architecture overview, docs/schema questions | **graphify**          | `graphify-out/GRAPH_REPORT.md`, `graphify query "…"`, `explain`, `affected`, `god-nodes`; MCP: `query_graph`, `get_node`, `get_neighbors`, `get_community`, `god_nodes`, `graph_stats`, `shortest_path` |
| "What breaks if I change X", "find callers of Y", refactor blast radius, low-level bugs  | **code-review-graph** | `impact --files <paths>`, `query callers_of\|callees_of\|imports_of\|tests_for <target>`, `detect-changes --brief`, `architecture`, `dead-code`, `large-functions`                                      |

### Orchestration Rules

1. **Sequential escalation (macro → micro)**: read `GRAPH_REPORT.md` to fix the component boundary, then switch to `code-review-graph` for call paths inside it. Never start at the call graph.
2. **Single engine per loop**: never query both engines in one reasoning loop. If `code-review-graph` finds no AST structure, abort to a narrow `Grep` — do not ask graphify for call trees.
3. **Stale cache**: `PostToolUse` runs `code-review-graph update --skip-flows` after every Edit/Write. After a large structural refactor run `code-review-graph build` by hand.
4. **Fallback tree**: MCP empty/errors → local markdown + READMEs → narrow surgical `Grep` → ask the user before any repo-wide scan.

### Hook Wiring

| Hook                          | Location                                | Behavior                                                                                                                                                 |
| ----------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SessionStart`                | `.claude/settings.json`                 | `code-review-graph status` — graph stats on session open                                                                                                 |
| `PostToolUse` (`Write\|Edit`) | `.claude/settings.json`                 | `code-review-graph update --skip-flows` — incremental re-index                                                                                           |
| `PreToolUse` (`Grep\|Glob`)   | `.claude/hooks/graphify-interceptor.sh` | **Advisory only, never blocks** — suggests `GRAPH_REPORT.md` first                                                                                       |
| `post-checkout`               | `.husky/post-checkout`                  | Branch switch → `code-review-graph update` + `graphify update .` (only if `graphify-out/` exists)                                                        |
| `pre-commit`                  | `.husky/pre-commit`                     | Step 3: `code-review-graph detect-changes --brief` — **advisory, never blocks**. Steps 1/2/4 (`pre-commit-enforce`, bundle check, lint-staged) unchanged |

This repo's `core.hooksPath` is local (`.husky/_`, husky) and overrides any global setting — graph re-index runs via `.husky/post-checkout`, **not** a global hook, and `.git/hooks/*` is skipped entirely. Husky dispatches as `sh -e`, so hook bodies are POSIX-safe and never end a guard on a bare `[ … ] && exit 0`. A global `~/.config/git/hooks` chain-through exists for other repos without a local `core.hooksPath` override.

Everything degrades to plain `Grep`/`Glob` if the tooling is absent. Disable: `GRAPH_HOOKS_DISABLED=1` (git hooks + `PostToolUse` re-index), `GRAPHIFY_HOOK_DISABLED=1` (`Grep`/`Glob` advisory).

Rebuild by hand: `code-review-graph build && graphify update .`

---

## Performance Metrics & Auditing

**Phase 5 Complete**: OnPush 100% (≤30ms), TrackBy 100%, Lighthouse 87/81, no memory leaks.  
Use `performance-audit` skill for profiling or see **[AGENTS.md](./AGENTS.md#phase-5-performance-metrics--evidence)** for metrics.

---

## Configuration Files Manifest

**AI Tool Configuration** (version-controlled, canonical source of truth):

| File                                  | Purpose                                                         | Version | Last Updated | Canonical |
| ------------------------------------- | --------------------------------------------------------------- | ------- | ------------ | --------- |
| CLAUDE.md                             | AI execution framework + best practices                         | 3.5.0   | 2026-09-07   | ✅        |
| AGENTS.md                             | Agent schema + collaboration rules                              | 1.5.0   | 2026-08-22   | ✅        |
| SKILLS.md                             | Canonical skill discovery + governance                          | 1.3.0   | 2026-08-22   | ✅        |
| .github/copilot-instructions.md       | GitHub Copilot optimized rules (streamlined)                    | 1.4.0   | 2026-08-22   | ✅        |
| .claude/settings.json                 | Global permissions + hooks                                      | —       | 2026-09-07   | ✅        |
| .claude/settings.local.json           | Local overrides (machine-specific)                              | —       | 2026-08-16   | ✅        |
| .claude/PERMISSIONS-GOVERNANCE.md     | Permission tiers + audit trail strategy                         | 1.0.0   | 2026-08-16   | ✅        |
| .claude/skills/INDEX.md               | Master skill catalog + metadata schema                          | —       | 2026-08-16   | ✅        |
| .claude/agents/architect.md           | Architect role agent (model: inherit)                           | 1.0.0   | 2026-08-31   | ✅        |
| .mcp.json                             | MCP servers: github (PAT from env), code-review-graph, graphify | —       | 2026-09-07   | ✅        |
| .claude/agents/coder.md               | Coder role agent (model: haiku)                                 | 1.0.0   | 2026-08-30   | ✅        |
| .claude/agents/reviewer.md            | Reviewer role agent (model: haiku)                              | 1.0.0   | 2026-08-30   | ✅        |
| .claude/CONTEXT-MANAGEMENT.md         | Token budget + context compression                              | —       | 2026-07-19   | Reference |
| .claude/MULTI_AGENT_GOVERNANCE.md     | Multi-agent orchestration rules                                 | —       | 2026-08-09   | Reference |
| .claude/TWO-GATE-SYSTEM.md            | Evidence-based execution gates                                  | —       | 2026-08-01   | Reference |
| .claude/rules/                        | Domain-specific architectural patterns (6 files)                | —       | 2026-08-01   | Reference |
| .claude/hooks/graphify-interceptor.sh | Advisory Grep/Glob hook (issues #300, #303)                     | —       | 2026-09-07   | Reference |

**Update Frequency**: Primary files (CLAUDE.md, AGENTS.md, SKILLS.md, copilot-instructions.md) reviewed monthly; rules reviewed when architecture changes.

---

## Environment Variables for AI Tool Configuration

**Canonical Source**: `.claude/settings.local.json` (`environment` section)

### Agent-Level Tuning (Task Complexity)

Set before spawning agent or invoking Claude Code CLI:

| Variable                   | Values         | Purpose                                              | Default |
| -------------------------- | -------------- | ---------------------------------------------------- | ------- |
| `MAX_THINKING_TOKENS`      | `auto`\|`int`  | Adaptive thinking budget (auto scales per task type) | `auto`  |
| `CLAUDE_CODE_EFFORT_LEVEL` | `auto`\|`high` | Task complexity hint (guides reasoning depth)        | `auto`  |
| `CLAUDE_CODE_TIMEOUT`      | `int` (min)    | Agent timeout before checkpoint                      | 30      |

**Examples**:

```bash
# Architectural task (use maximum reasoning)
MAX_THINKING_TOKENS=8000 CLAUDE_CODE_EFFORT_LEVEL=high claude

# Quick lint fix (minimize overhead)
MAX_THINKING_TOKENS=1000 CLAUDE_CODE_EFFORT_LEVEL=auto claude

# Adaptive (recommended for most tasks)
MAX_THINKING_TOKENS=auto claude
```

### Development Environment (Static)

Set in `.claude/settings.local.json` `environment` section (automatically applied):

| Variable             | Value                   | Purpose                             |
| -------------------- | ----------------------- | ----------------------------------- |
| `DOTNET_ENVIRONMENT` | `Development`           | Local dev (not Production)          |
| `ASPNETCORE_URLS`    | `http://localhost:5000` | Backend API port                    |
| `NODE_ENV`           | `development`           | Frontend dev mode (hot reload)      |
| `DOCKER_BUILDKIT`    | `1`                     | Faster Docker builds (cache layers) |

**Precedence** (highest to lowest):

1. CLI env vars (set before invoking agent): `MAX_THINKING_TOKENS=8000 claude`
2. `.claude/settings.local.json` environment section
3. System environment variables
4. Hard defaults in CLAUDE.md

### Security Notes

- **Never commit secrets** to `.claude/settings.json` or `.claude/settings.local.json`
- Reference `.env.local` (gitignored) for sensitive values
- PreToolUse hooks block `export [A-Z_]*=` patterns (prevent env injection)

---

## Phase Ordering (Strict Sequence)

**Block PRs** if order violated.

**Backend**: #148 (authorization) → #149 (workflows) → #147 (rate limiting)  
**Frontend**: #47 (architecture) — ✅ COMPLETE

---

## Tools & Prerequisites

**.NET 10+** | **Node.js 18+, pnpm 8+** | **Docker** (SQL Server) | **dotnet-ef global** | **Rider 2024.x or VS Code**
