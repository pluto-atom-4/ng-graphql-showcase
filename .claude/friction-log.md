# Friction Log

Track AI agent issues, hallucinations, and outdated patterns. Updates inform CLAUDE.md + rule file maintenance.

**Schedule**: Review monthly. Act immediately on critical friction events.

---

## Maintenance Triggers

| Event                             | Action                                     | Log Entry                   |
| --------------------------------- | ------------------------------------------ | --------------------------- |
| Agent hallucinates API route      | Update CLAUDE.md with correct path         | Date + error + fix          |
| Agent uses outdated build script  | Add to "Essential Commands" or update      | Date + script + replacement |
| Agent misses pattern in rule file | Add reference to CLAUDE.md troubleshooting | Date + pattern + fix        |
| Repeated task takes >30min        | Convert to skill in SKILLS.md              | Date + task + automation    |
| Rule file becomes >1000 lines     | Split into multiple focused files          | Date + file + split plan    |

---

## Entry Template

```markdown
**Date**: YYYY-MM-DD  
**Event Type**: [Hallucination | Outdated | Missing Reference | Common Friction]  
**Description**: What happened  
**Impact**: Why it matters  
**Fix**: What changed (file + line or new skill)  
**Tokens Saved**: Approx. reduction in context bloat (if applicable)
```

---

## Recent Entries

**Date**: 2026-07-10  
**Event Type**: Configuration  
**Description**: Pre-commit hook showed CRLF line ending warnings during settings.json + markdown file formatting. LLM briefly uncertain whether commit actually succeeded (husky pre-commit ran, prettier auto-formatted files).  
**Impact**: Low. Commit succeeded; warnings are expected in mixed Windows/Unix environment. BUT: Unclear error output could confuse future agents during multi-agent loops.  
**Fix**: Documented in this entry. Future: Update husky deprecation warning in CLAUDE.md or add note to PROCEDURES.md about pre-commit hook expectations.  
**Tokens Saved**: ~10 tokens (documented in friction-log so future agents aware)

---

---

## Metrics

| Metric                  | Target | Current |
| ----------------------- | ------ | ------- |
| CLAUDE.md lines         | <200   | 156 ✅  |
| Rule file duplication   | 0%     | 0% ✅   |
| Monthly friction events | <5     | —       |
| Avg time-to-fix         | <30min | —       |

---

## Notes

- Keep this file lean (<200 lines)
- Archive resolved entries to `/docs/friction-history.md` annually
- Use to inform skill creation (see SKILLS.md)
  2026-08-02T17:09:25-07:00 config file changed: /home/pluto-atom-4/Documents/stoke-full-stack/react-graphql-playground/.claude/settings.json
  2026-08-02T17:10:13-07:00 config file changed: /home/pluto-atom-4/Documents/stoke-full-stack/react-graphql-playground/.claude/settings.json
