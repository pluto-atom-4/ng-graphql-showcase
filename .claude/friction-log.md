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

_None yet. Entries added as friction events occur._

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
