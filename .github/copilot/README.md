# GitHub Copilot Configuration & Procedures

This directory contains GitHub Copilot-specific configurations, procedures, and guidelines for the ng-graphql-playground project.

## Directory Structure

```
.github/copilot/
├── README.md (this file)
├── rules/
│   ├── pr-review-workflow.md — Automated GitHub PR review procedure
│   └── implementation-flow-rules.md — Standardized GitHub issue implementation workflow
└── templates/
    └── IMPLEMENTATION_PLAN_TEMPLATE.md — Reusable implementation plan template
```

## Quick Reference

| Document | Purpose | Audience |
|----------|---------|----------|
| **[rules/pr-review-workflow.md](rules/pr-review-workflow.md)** | Phase-based PR review procedure with mandatory comment posting | Developers, Copilot users, PR reviewers |
| **[rules/implementation-flow-rules.md](rules/implementation-flow-rules.md)** | Phase-based implementation workflow with plan template and GitHub Actions validation | All implementers, issue handlers |
| **[templates/IMPLEMENTATION_PLAN_TEMPLATE.md](templates/IMPLEMENTATION_PLAN_TEMPLATE.md)** | Standardized template for GitHub issue implementations | All implementers |

## Key Procedures

### PR Review Workflow

When reviewing a GitHub PR, Copilot follows a **mandatory three-phase workflow**:

1. **Phase 1**: Gather PR details, examine changes, check CI/CD status
2. **Phase 2**: Analyze code against architecture patterns and requirements
3. **Phase 3**: **Post review as GitHub PR comment** ← MANDATORY final step

**Key Rule**: Review outcomes MUST be posted as GitHub PR comments for team visibility.

For details, see: [rules/pr-review-workflow.md](rules/pr-review-workflow.md)

### Implementation Flow Workflow

When implementing GitHub issues, follow the **standardized multi-phase workflow**:

1. **Phase 1**: Read and understand issue, plan implementation, create feature branch
2. **Phase 2**: Copy implementation plan template, complete all required sections
3. **Phase 3**: Implement features while updating file manifest continuously
4. **Phase 4**: Run pre-commit checks (format, lint, test, type-check)
5. **Phase 5**: Create PR and follow manual review procedure
6. **Phase 6**: Follow PR review procedure (Issue #19)
7. **Phase 7**: Merge after approval and cleanup

**Key Rule**: Every implementation MUST have:
- Feature branch: `feat/issue-N-kebab-case`
- Implementation plan: `docs/implementation-planning/issue-N-*.md`
- Complete file manifest tracked throughout
- All implementation criteria satisfied before merge

For details, see: [rules/implementation-flow-rules.md](rules/implementation-flow-rules.md)

## Related Files

- **Main Instructions**: See `../../copilot-instructions.md`
- **Claude Code Guide**: See `../../CLAUDE.md`
- **Contribution Guide**: See `../../CONTRIBUTING.md`
- **Architecture Guide**: See `../../docs/research-architecuture-design.md`

## Planned Enhancements

Future enhancements planned to support automated enforcement:

| Feature | Issue | Status | Details |
|---------|-------|--------|---------|
| **GitHub Actions Implementation Validation** | #23 | 📋 Planned | Automate validation of implementation plans on PR creation |
| **Automated Plan Structure Checking** | #23 | 📋 Planned | Verify all required sections present in implementation plans |

**Note**: GitHub Actions automation is deferred to Issue #23 when team grows to 5+ contributors. The current manual process with Issue #19 PR review is sufficient for single-contributor + Copilot workflows. See `docs/implementation-planning/issue-22-implementation.md` for Phase 2 deferral rationale.

## Future Procedures (Planned)

- [ ] Security review checklist template
- [ ] Performance verification procedure
- [ ] Documentation update guidelines
- [ ] Implementation criteria validation in GitHub Actions

## Best Practices

When working with Copilot in this repository:

✅ **DO**:
- Follow procedures exactly as documented
- Post review outcomes to GitHub
- Reference requirements and issues
- Maintain audit trail via comments
- Escalate unclear requirements before reviewing

❌ **DON'T**:
- Skip final comment posting step
- Post incomplete reviews
- Make assumptions about requirements
- Comment on style alone
- Skip verification checklists

## GitHub Copilot CLI Integration

These procedures apply to:
- 🤖 Claude Code sessions (`.claude/settings.json`)
- 📝 GitHub Copilot CLI sessions (`gh copilot ...`)
- 🔄 Automated Copilot workflows

All tools follow the same procedures to ensure consistency.

## Questions or Suggestions?

If you have improvements to these procedures:
1. Create an issue with the `copilot-procedure` label
2. Reference the specific section that needs updating
3. Provide rationale for the change
4. Link any supporting documentation

---

**Last Updated**: 2026-05-23  
**Maintained By**: Development Team  
**Status**: Active & in use  
**Version**: 1.1 (Added implementation flow templates and automation)
