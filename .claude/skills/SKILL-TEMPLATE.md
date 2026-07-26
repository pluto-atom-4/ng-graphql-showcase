---
name: skill-template
description: Template for creating new discoverable skills
trigger: ["skill template", "how to create skill"]
scope: "Architects, Coders, Reviewers — all agents"
requires: ["Read", "Edit", "Write"]
priority: 1
related: []
depends_on: []
---

# Skill Template

Use this template when creating new skills.

## Frontmatter Reference

| Field         | Type   | Required | Notes                                      |
| ------------- | ------ | -------- | ------------------------------------------ |
| `name`        | string | ✅       | kebab-case, 20 chars max                   |
| `description` | string | ✅       | One line, 60 chars max (for skill picker)  |
| `trigger`     | array  | ✅       | Keywords that auto-invoke this skill       |
| `scope`       | string | ❌       | Which agents can use (default: all)        |
| `requires`    | array  | ❌       | Tools needed: Read, Edit, Write, Bash, etc |
| `priority`    | number | ❌       | 1-10 (higher = matches sooner; default: 5) |
| `related`     | array  | ❌       | Names of related skills                    |
| `depends_on`  | array  | ❌       | Skills that should run first               |

## Trigger Best Practices

**Good triggers** (concise, memorable):

- `codegen` (short form)
- `code generation` (long form)
- `GraphQL schema change` (specific phrase)
- `type safety pipeline` (common phrase)

**Avoid**:

- ❌ Single-letter triggers (`a`, `x`)
- ❌ Overly generic (`help`, `run`, `check`)
- ❌ Slash commands (`/plan`, `/compact`)
- ❌ Existing tool names (`read`, `bash`)

## Scope Reference

| Scope            | Access                                |
| ---------------- | ------------------------------------- |
| `all` or omitted | Any agent, human, skill picker        |
| `architect`      | Plan Mode agent only                  |
| `coder`          | Code execution agent only             |
| `reviewer`       | Testing/review agent only             |
| `human-only`     | User-triggered only (not auto-invoke) |

## Structure

### Minimal Skill (3 sections)

```markdown
---
name: my-skill
description: Brief one-line description
trigger: ["keyword1", "keyword2"]
---

# My Skill

## Overview

What problem this skill solves.

## Usage

When to invoke this skill.

## Instructions

Step-by-step procedure.
```

### Full Skill (recommended)

```markdown
---
name: my-skill
description: Brief description
trigger: ["keyword1", "keyword2"]
scope: "all"
requires: ["Read", "Edit", "Bash"]
priority: 5
related: ["related-skill-1", "related-skill-2"]
depends_on: ["prerequisite-skill"]
---

# My Skill Name

## Overview

What problem this skill solves and why it matters.

## Triggers

- **Automatic**: Skill auto-invokes when user mentions a trigger keyword
- **Manual**: User can also type `/my-skill` to invoke explicitly

## Usage

When to use this skill:

- Scenario 1
- Scenario 2

**Preconditions**: What must be true before running

- [ ] Condition 1
- [ ] Condition 2

## Instructions

### Step 1: Description

Action here.

### Step 2: Description

Action here.

### Verification

How to verify the skill succeeded:

- [ ] Check 1
- [ ] Check 2

## Related Skills

- [[related-skill-1]] — For complementary work
- [[related-skill-2]] — If this skill fails

## Troubleshooting

| Problem | Cause      | Fix      |
| ------- | ---------- | -------- |
| Error X | Root cause | Solution |

## References

- [Link to docs](../rules/example.md)
- [GitHub issue #123](https://github.com/...)
```

## Examples

### Example 1: codegen-sync

Location: `.claude/skills/codegen-sync/SKILL.md`

````markdown
---
name: codegen-sync
description: Regenerate GraphQL types after backend schema changes
trigger: ["codegen", "schema change", "code generation"]
scope: "all"
requires: ["Read", "Bash"]
priority: 8
related: ["migration-generator"]
---

# Codegen Sync

## Overview

Auto-generates TypeScript types from GraphQL schema after backend schema changes.

Part of type-safety pipeline: C# entity → schema.graphql → graphql.ts

## Usage

Invoke automatically after `dotnet build` detects new schema.graphql.

Or manually: User says "run codegen" or "regenerate types".

## Instructions

### Step 1: Verify schema.graphql exists

```bash
ls backend/src/FactoryApp.WebApi/schema.graphql
```
````

### Step 2: Run codegen

```bash
pnpm codegen
```

### Step 3: Verify types updated

```bash
ls -la frontend/src/app/api/generated/graphql.ts
```

### Verification

- [ ] schema.graphql generated without errors
- [ ] graphql.ts updated (check timestamp)
- [ ] No type errors in frontend build

## Related Skills

- [[migration-generator]] — For database schema changes

```

### Example 2: pr-review-workflow

Location: `.claude/skills/pr-review-workflow/SKILL.md`

Uses three-phase analysis:
1. Gather PR details
2. Analyze changes
3. Post findings to GitHub

Documented in separate file for clarity.

## Testing Skills

Before committing, test skill triggers:

1. **Manual test**:
```

[user mentions keyword]
→ Harness should suggest or auto-invoke skill

````

2. **Discovery log**:
```bash
tail -f .claude/skill-discovery.log
````

Should show skill loaded + invoked

3. **Frontmatter validation**:
   ```bash
   # Check YAML is valid
   grep -A 10 "^---" .claude/skills/*/SKILL.md
   ```

## Version Control

- ✅ Commit SKILL.md files to git
- ✅ Update .claude/skills/INDEX.md when adding skills
- ✅ Link from this template in MEMORY.md if it's a new pattern
- ❌ Don't commit `.disabled` files (archive separately if needed)

## Maintenance

**Quarterly review**:

- [ ] Check trigger keywords still relevant
- [ ] Update description if scope changed
- [ ] Verify `related:` and `depends_on:` still accurate
- [ ] Test triggers against actual user language patterns
