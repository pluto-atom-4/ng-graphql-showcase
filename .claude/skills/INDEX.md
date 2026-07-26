# Skill Discovery Index

**Version:** 1.0.0 | **Updated:** 2026-07-25  
**Location:** `.claude/skills/`

Index of discoverable skills with metadata for lazy-loading.

## Discovery Mechanism

1. **Harness scans** `.claude/skills/*/SKILL.md` for YAML frontmatter
2. **Extracts** `trigger:` keywords (array of strings)
3. **On user input**: Matches keywords against user messages
4. **Auto-invoke**: If match found, load and execute skill

## Skill Frontmatter

Each skill file must include YAML frontmatter:

```yaml
---
name: my-skill
description: What this skill does (one sentence)
trigger: ["keyword1", "keyword2", "phrase with spaces"]
scope: "which agents can invoke (optional)"
requires: ["tool1", "tool2"]
priority: 10 # Higher = matches sooner
---
[Skill body - markdown or instructions]
```

## Registered Skills

| Skill                   | Triggers                          | Path                                          | Type       |
| ----------------------- | --------------------------------- | --------------------------------------------- | ---------- |
| **codegen-sync**        | codegen, schema change            | `.claude/skills/codegen-sync/SKILL.md`        | Automation |
| **lsp-setup**           | LSP, IDE setup, language server   | `.claude/skills/lsp-setup/SKILL.md`           | Setup      |
| **migration-generator** | migration, DB change, EF Core     | `.claude/skills/migration-generator/SKILL.md` | Automation |
| **pr-review-workflow**  | review PR, PR review, code review | `.claude/skills/pr-review-workflow/SKILL.md`  | Analysis   |

## Adding a New Skill

1. Create `.claude/skills/<name>/` directory
2. Create `SKILL.md` with YAML frontmatter (see template below)
3. Add to this INDEX.md table
4. Test via skill picker or by mentioning a trigger keyword

### Template

```markdown
---
name: my-skill-name
description: One-line summary of what this skill does
trigger: ["keyword1", "keyword2", "multi-word phrase"]
scope: "specific to agents: architect, coder, reviewer, or all"
requires: ["Read", "Bash"] # Tools this skill uses
priority: 5 # Default 5; higher values match sooner
---

# My Skill Name

## Overview

What this skill does and why it's useful.

## Usage

When to use this skill.

## Instructions

Step-by-step what the skill will do.
```

## Priority & Conflict Resolution

If multiple skills match keywords:

1. Sort by `priority` (highest first)
2. Sort by `trigger` match type (exact phrase > keyword)
3. User selects if still ambiguous

**Example**: "code review" could trigger both `pr-review-workflow` (exact phrase match, priority 10) and `code-review` skill (keyword match, priority 5). First skill wins.

## Disabling a Skill

To disable a skill temporarily without deleting it:

1. Rename `SKILL.md` → `SKILL.md.disabled`
2. Harness skips discovery on `.disabled` files
3. No need to edit config files

## Best Practices

- ✅ Keep triggers **concise and memorable** (2-3 words max)
- ✅ Include both short and long trigger forms ("codegen", "code generation")
- ✅ Use lowercase for triggers
- ✅ Document scope clearly (which agents can use)
- ✅ Test with actual user keywords before adding
- ❌ Don't use overly generic keywords ("help", "run", "check")
- ❌ Don't use keywords that conflict with slash commands
- ❌ Don't store complex data in frontmatter (use skill body)

## Discovery Logs

Harness logs skill discovery to `.claude/skill-discovery.log`:

```
[2026-07-25 14:32:10] Scanning .claude/skills/
[2026-07-25 14:32:10] Found: codegen-sync (triggers: codegen, schema change)
[2026-07-25 14:32:10] Found: migration-generator (triggers: migration, DB change, EF Core)
[2026-07-25 14:32:10] User input: "run codegen after schema change"
[2026-07-25 14:32:11] Match: codegen-sync (trigger: "codegen")
[2026-07-25 14:32:11] Invoking: codegen-sync
```

## Cross-Referencing

Skills can reference other skills via frontmatter:

```yaml
depends_on: ["lsp-setup"]
related: ["codegen-sync", "migration-generator"]
```

Harness can suggest related skills after execution.
