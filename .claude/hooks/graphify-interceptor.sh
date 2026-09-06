#!/usr/bin/env bash
# Advisory-only PreToolUse hook for Grep/Glob (better-code-review-graph rollout, issue #300).
#
# ADVISORY ONLY — never blocks (per human decision, first-rollout risk mitigation).
# Grep/Glob are load-bearing for every agent role in this repo; a misconfigured
# hard block would silently break Architect/Coder/Reviewer sessions with no
# documented rollback path. This hook only suggests reading GRAPH_REPORT.md
# first — it always allows the underlying tool call to proceed.
#
# No network calls (see .claude/hooks/README.md). Only reads a local,
# pre-built GRAPH_REPORT.md if present. The tool that produces that file
# (`graphify update .`) runs in the git post-checkout hook, not here.
#
# No-ops entirely if the uv/uvx toolchain isn't installed on this machine —
# graph tooling is optional, not a hard prerequisite (CLAUDE.md).
set -euo pipefail

command -v uvx >/dev/null 2>&1 || exit 0

if [ -f "GRAPH_REPORT.md" ]; then
  cat <<'EOF'
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"Advisory: GRAPH_REPORT.md is available — consider reading it first for a macro architectural overview before wide Grep/Glob scans. This is a suggestion only; proceeding either way."}}
EOF
fi

exit 0
