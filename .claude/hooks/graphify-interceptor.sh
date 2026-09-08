#!/usr/bin/env bash
# Advisory-only PreToolUse hook for Grep/Glob (graph tooling, issues #300/#303).
#
# ADVISORY ONLY — never blocks (per human decision, first-rollout risk mitigation).
# Grep/Glob are load-bearing for every agent role in this repo; a misconfigured
# hard block would silently break Architect/Coder/Reviewer sessions with no
# documented rollback path. This hook only suggests reading GRAPH_REPORT.md
# first — it always allows the underlying tool call to proceed.
#
# No network calls (see .claude/hooks/README.md). Only reads a local, pre-built
# GRAPH_REPORT.md if present. The tool that produces that file (`graphify
# update .`) runs in the git post-checkout hook, not here.
#
# No-ops entirely if graphify isn't installed on this machine — graph tooling is
# optional, not a hard prerequisite (CLAUDE.md).
set -euo pipefail

command -v graphify >/dev/null 2>&1 || exit 0

# `graphify update` writes the report into graphify-out/. The bare top-level
# path is still probed for older layouts and for repos that relocate the output.
REPORT=""
for candidate in "graphify-out/GRAPH_REPORT.md" "GRAPH_REPORT.md"; do
  if [ -f "$candidate" ]; then
    REPORT="$candidate"
    break
  fi
done

[ -n "$REPORT" ] || exit 0

cat <<EOF
{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":"Advisory: $REPORT is available — consider reading it first for a macro architectural overview before wide Grep/Glob scans, then escalate to code-review-graph for call-level detail. This is a suggestion only; proceeding either way."}}
EOF

exit 0
