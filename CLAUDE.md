# CLAUDE.md — AI Execution Framework

**Version:** 3.3.0 | **Last Updated:** 2026-08-16  
**Canonical:** [AGENTS.md](./AGENTS.md) | **Rules:** [.claude/rules/](./.claude/rules/) | **Skills Index:** [.claude/skills/INDEX.md](./.claude/skills/INDEX.md)

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

## Skill Discovery & Auto-Invocation

**Location**: `.claude/skills/` | **Master Index**: [.claude/skills/INDEX.md](./.claude/skills/INDEX.md)

**Skills Catalog** (Trigger keywords auto-discovered from YAML frontmatter):

| Skill                 | Trigger Keywords                                 | Use Case                                                 |
| --------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| `codegen-sync`        | `codegen`, `schema change`, `graphql regenerate` | Backend schema changes → frontend type-safe regeneration |
| `lsp-setup`           | `LSP`, `IDE setup`, `language server`            | Configure code intelligence (IDE extensions)             |
| `migration-generator` | `migration`, `DB change`, `EF Core`              | Create + validate Entity Framework Core migrations       |
| `performance-audit`   | `performance audit`, `profile`, `lighthouse`     | Lighthouse + bundle analysis profiling                   |
| `pr-review-workflow`  | `review PR`, `PR review`, `code review`          | Automated PR review (quality, security, tests)           |
| `pre-commit-enforce`  | `pre-commit`, `validation`, `lint check`         | Pre-commit hook validation (format + type check)         |

**Auto-Discovery Mechanism**:

1. **Skill Registration**: Each skill has `.claude/skills/<name>/SKILL.md` with YAML frontmatter
2. **Keyword Scanning**: Harness scans `trigger:` array in frontmatter → builds keyword registry
3. **User Invocation**: Type skill name or trigger keyword → harness locates + executes skill
4. **Skill Parameters**: Optional configuration in `.claude/settings.json` `skillOverrides` section

**Adding New Skills**: Create `.claude/skills/<name>/SKILL.md` with YAML schema (see [.claude/skills/INDEX.md](./.claude/skills/INDEX.md#schema) for template).

---

## Performance Metrics & Auditing

**Phase 5 Complete**: OnPush 100% (≤30ms), TrackBy 100%, Lighthouse 87/81, no memory leaks.  
Use `performance-audit` skill for profiling or see **[AGENTS.md](./AGENTS.md#phase-5-performance-metrics--evidence)** for metrics.

---

## Configuration Files Manifest

**AI Tool Configuration** (version-controlled, canonical source of truth):

| File                              | Purpose                                          | Version | Last Updated | Canonical |
| --------------------------------- | ------------------------------------------------ | ------- | ------------ | --------- |
| CLAUDE.md                         | AI execution framework + best practices          | 3.3.0   | 2026-08-16   | ✅        |
| AGENTS.md                         | Agent onboarding + skill discovery               | 1.4.0   | 2026-08-16   | ✅        |
| SKILLS.md                         | Skill automation + governance                    | 1.2.0   | 2026-08-16   | ✅        |
| .github/copilot-instructions.md   | GitHub Copilot agent guide                       | 1.3.0   | 2026-08-16   | ✅        |
| .claude/settings.json             | Global permissions + hooks                       | —       | 2026-08-16   | ✅        |
| .claude/settings.local.json       | Local overrides (machine-specific)               | —       | 2026-08-16   | ✅        |
| .claude/PERMISSIONS-GOVERNANCE.md | Permission tiers + audit trail strategy          | 1.0.0   | 2026-08-16   | ✅        |
| .claude/skills/INDEX.md           | Master skill catalog + metadata schema           | —       | 2026-08-16   | ✅        |
| .claude/CONTEXT-MANAGEMENT.md     | Token budget + context compression               | —       | 2026-07-19   | Reference |
| .claude/MULTI_AGENT_GOVERNANCE.md | Multi-agent orchestration rules                  | —       | 2026-08-09   | Reference |
| .claude/TWO-GATE-SYSTEM.md        | Evidence-based execution gates                   | —       | 2026-08-01   | Reference |
| .claude/rules/                    | Domain-specific architectural patterns (6 files) | —       | 2026-08-01   | Reference |

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

---

## Rules Router (Modular Patterns by Domain)

**Path-specific rules auto-loaded when modifying relevant files** (see [.github/copilot/rules/](./.github/copilot/rules/) in Phase 3):

| Rule File                                                              | Domain       | Key Topics                                                           |
| ---------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------- |
| [accessibility-patterns.md](./.claude/rules/accessibility-patterns.md) | Frontend/UX  | WCAG 2.1 Level AA, keyboard nav, ARIA, focus management              |
| [database-rules.md](./.claude/rules/database-rules.md)                 | Data Layer   | Transactions, real-DB testing, Dapper, EF Core integration           |
| [backend-patterns.md](./.claude/rules/backend-patterns.md)             | ASP.NET Core | EF Core, DataLoaders, projections, testing strategy                  |
| [frontend-patterns.md](./.claude/rules/frontend-patterns.md)           | Angular 19   | OnPush detection, trackBy, type-safety pipeline, testing             |
| [graphql-patterns.md](./.claude/rules/graphql-patterns.md)             | GraphQL      | Query depth (≤5 layers), entity exposure, type-safety, subscriptions |
| [workflow-integration.md](./.claude/rules/workflow-integration.md)     | Elsa v3.5.3  | Activities, state management, async patterns, Phase 5c status        |
