# Hook System Configuration

**Version:** 1.0.0 | **Location:** `.claude/hooks/`

Hooks allow automated enforcement of safety gates and code quality checks at tool-use time.

## Hook Types

### PreToolUse Hooks

Execute **before** a tool is invoked. Block unsafe operations.

**Location**: `.claude/hooks/pre-tool-use.json`

**Use cases:**

- Block destructive Bash commands (rm -rf, git reset --hard, etc)
- Block manual edits of auto-generated files
- Enforce code review gates before production changes

### PostToolUse Hooks

Execute **after** a tool completes. Auto-apply formatting/linting.

**Location**: `.claude/hooks/post-tool-use.json`

**Use cases:**

- Auto-format on file save (prettier, gofmt)
- Auto-lint frontend code (eslint)
- Auto-run type checks (tsc)
- Log file changes to friction-log

## Configuration Format

See `.claude/settings.json` for hook definitions. Hooks are specified in:

```json
{
  "hooks": {
    "preToolUse": {/* rules array */},
    "postToolUse": {/* rules array */}
  }
}
```

## Rule Structure

```json
{
  "tool": "Bash|Edit|Write",
  "patterns": ["pattern1", "pattern2"],
  "action": "block|warn|log",
  "message": "User-facing message"
}
```

## Loading Hooks

1. **Startup**: Harness loads hooks from `.claude/settings.json`
2. **Per-invocation**: Harness checks patterns against tool arguments
3. **Action**: Execute hook action (block, warn, or log)
4. **Fallback**: User confirmation if action requires it

## Examples

### Block Destructive Git Commands

```json
{
  "tool": "Bash",
  "patterns": ["git reset --hard", "git push --force"],
  "action": "block",
  "message": "Force-push blocked. Use explicit confirmation: '! git push --force'"
}
```

### Block Auto-Generated File Edits

```json
{
  "tool": "Edit",
  "patterns": ["schema.graphql", "graphql.ts"],
  "action": "block",
  "message": "Auto-generated file. Regenerate via: dotnet build or pnpm codegen"
}
```

### Auto-Format on Save

```json
{
  "tool": "Write|Edit",
  "patterns": ["**/*.ts", "**/*.md"],
  "action": "format",
  "formatter": "prettier --write"
}
```

## Updating Hooks

Edit `.claude/settings.json` → `hooks` section. Changes take effect immediately on next tool use.

**Never commit hook rules that require external APIs** — keep hooks local-only (no network calls).
