---
name: PR Review Workflow
description: Automated PR review with code quality, security, and testing checks
trigger: "/code-review pr-review-workflow"
atomic: true
scope: single-file or cross-file diff review
---

# PR Review Workflow

**Purpose**: Systematic review of pull requests before merge, checking correctness, security, and test coverage.

## Trigger

```
/code-review [--comment] [--fix]
```

## Steps

1. **Gather PR Context**
   - Fetch current branch commits vs. main
   - Identify changed files (backend, frontend, infra)
   - Run `git diff main...HEAD` to see full diff

2. **Code Quality Checks**
   - ❌ **Never DO**: Raw EF Core entities in GraphQL (use DTOs)
   - ❌ **Never DO**: EF Core + Dapper writes without shared `DbTransaction`
   - ❌ **Never DO**: Mocking DbContext in tests (use real SQL Server)
   - ✅ Query depth ≤ 5 layers (split large queries)
   - ✅ `*ngFor` has trackBy functions
   - ✅ DataLoaders used for child entity queries
   - ✅ NoTracking on EF Core reads by default

3. **Test Coverage**
   - Backend: `dotnet test backend/src`
   - Frontend: `pnpm --filter frontend run test`
   - Integration tests against real SQL Server, not mocks

4. **Security Review**
   - No hardcoded connection strings or secrets
   - No SQL injection in Dapper queries (use parameters)
   - No XSS in Angular templates (sanitization, no `[innerHTML]`)
   - CORS/auth boundaries checked

5. **Type Safety**
   - schema.graphql committed (auto-generated, must commit)
   - graphql.ts never edited manually
   - C# entity → schema → codegen pipeline intact

6. **Documentation**
   - CLAUDE.md rules followed
   - New patterns documented in `.claude/rules/`
   - Migration reversibility documented

## Output

Pass `--comment` to post findings as inline PR comments.  
Pass `--fix` to apply auto-fixable findings to working tree.

## Related Rules

See: [[backend-patterns]], [[graphql-patterns]], [[database-rules]]
