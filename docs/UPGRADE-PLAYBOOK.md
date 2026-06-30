# Dependency Upgrade Playbook

Process and safety checks for upgrading dependencies across the full-stack platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Safety Checklist](#safety-checklist)
3. [Upgrade Sequences](#upgrade-sequences)
4. [Known Incompatibilities](#known-incompatibilities)
5. [Rollback Procedures](#rollback-procedures)
6. [Monitoring After Upgrade](#monitoring-after-upgrade)

---

## Overview

### Dependency Landscape

| Layer     | Framework                       | Version | Upgrade Cadence |
| --------- | ------------------------------- | ------- | --------------- |
| SDK       | .NET                            | 10.0.x  | Quarterly (LTS) |
| SDK       | Node.js                         | 18+     | Quarterly       |
| Database  | EF Core                         | 9.0.x   | With .NET       |
| GraphQL   | Hot Chocolate                   | 15.1.x  | Quarterly       |
| Workflows | Elsa                            | 3.5.x   | Quarterly       |
| Auth      | System.IdentityModel.Tokens.Jwt | 8.2.x   | On-demand       |
| Crypto    | BCrypt.Net-Next                 | 4.0.x   | On-demand       |
| Testing   | xUnit                           | 2.8.x   | On-demand       |

### Upgrade Categories

**Type A: Framework (Affects All Layers)**

- .NET SDK upgrade
- Node.js upgrade
- Docker version

**Type B: Domain Layer**

- EF Core
- EF Core Design Tools
- SQL Server provider

**Type C: GraphQL Layer**

- Hot Chocolate
- GraphQL Code Generator
- Dapper

**Type D: Workflow Layer**

- Elsa

**Type E: Security/Utility**

- JWT libraries
- BCrypt
- Testing libraries

---

## Safety Checklist

**Before starting any upgrade:**

- [ ] Branch: `git checkout -b upgrade/component-X.Y.Z`
- [ ] Backup: `git stash` (saves uncommitted work)
- [ ] Documentation: Check component's migration guide
- [ ] Breaking changes: Review changelog for `⚠️ BREAKING`
- [ ] Dependencies: Check for cascading updates required
- [ ] Tests: Run full suite after each change
- [ ] Build: `dotnet build && pnpm build`

**For each changed component:**

- [ ] Unit tests pass locally
- [ ] Integration tests pass (requires SQL Server running)
- [ ] Frontend build succeeds (TypeScript strict mode)
- [ ] No new warnings in build output
- [ ] Linting passes: `pnpm lint`

**Before merging:**

- [ ] Create comprehensive commit message
- [ ] Link to relevant issue (or create one)
- [ ] Request code review
- [ ] CI pipeline passes

---

## Upgrade Sequences

### Scenario 1: .NET SDK Upgrade (9.0 → 10.0)

This is a **Type A: Framework** upgrade affecting all layers.

#### Step 1: Update Global SDK

```bash
# Check current version
dotnet --version  # e.g., 9.0.x

# Download/install .NET 10
# Via official installer: https://dotnet.microsoft.com/download

# Verify installation
dotnet --version  # Should be 10.0.x
```

#### Step 2: Create Upgrade Branch

```bash
git checkout -b upgrade/dotnet-10.0
```

#### Step 3: Update Project Files

```bash
cd backend

# Update all .csproj files to net10.0
# Change: <TargetFramework>net9.0</TargetFramework>
# To:     <TargetFramework>net10.0</TargetFramework>

# Files to update:
# - src/FactoryApp.Domain/FactoryApp.Domain.csproj
# - src/FactoryApp.GraphQL/FactoryApp.GraphQL.csproj
# - src/FactoryApp.Workflows/FactoryApp.Workflows.csproj
# - src/FactoryApp.WebApi/FactoryApp.WebApi.csproj
# - FactoryApp.Tests/FactoryApp.Tests.csproj
```

#### Step 4: Update Dependencies

```bash
cd backend

# Update all NuGet packages to match .NET 10
dotnet list package --outdated

# Update packages:
dotnet package update  # Updates all to latest
# Or selectively:
dotnet package update -p FactoryApp.Domain
```

**Critical packages to check:**

- Microsoft.EntityFrameworkCore (should match .NET version)
- Microsoft.AspNetCore.\* (should match .NET version)
- HotChocolate.\* (check compatibility)

#### Step 5: Build & Test

```bash
# Clean build
dotnet clean
dotnet build ./backend/FactoryApp.slnx

# Run tests (SQL Server must be running)
pnpm docker:up
sleep 10
dotnet test ./backend/FactoryApp.Tests/FactoryApp.Tests.csproj

# Check for warnings
# Look for: CS warnings, NuGet warnings, tool warnings
```

#### Step 6: Frontend Update

```bash
# Update Node.js version file (if using nvm)
echo "18.0.0" > .nvmrc

# Update Node.js
nvm install 18  # or use LTS installer

# Update npm/pnpm
pnpm install -g pnpm@latest

# Update dependencies
pnpm install
pnpm update

# Build & test
pnpm build
pnpm test
```

#### Step 7: Commit & Create PR

```bash
git add -A
git commit -m "chore: Upgrade .NET to 10.0 and Node.js to 18.x

- Update all project files to net10.0 target
- Update NuGet packages to .NET 10 compatible versions
- Update npm dependencies for Node.js 18
- All tests pass locally
- No breaking changes to code"

git push -u origin upgrade/dotnet-10.0

# Create PR via GitHub
gh pr create --title "chore: Upgrade .NET 10 & Node.js 18" \
  --body "Framework upgrade. All tests passing. Ready for review."
```

### Scenario 2: Hot Chocolate Upgrade (15.1 → 15.2)

**Type C: GraphQL Layer** upgrade.

#### Step 1: Create Branch

```bash
git checkout -b upgrade/hot-chocolate-15.2
```

#### Step 2: Update NuGet Package

```bash
cd backend/src/FactoryApp.GraphQL

# Update Hot Chocolate packages
dotnet add package HotChocolate.AspNetCore --version 15.2.0
dotnet add package HotChocolate.Types --version 15.2.0
dotnet add package HotChocolate.Execution --version 15.2.0

# If using subscriptions:
cd ../FactoryApp.Workflows
dotnet add package HotChocolate.Subscriptions --version 15.2.0
```

#### Step 3: Check for Breaking Changes

```bash
# Visit: https://github.com/ChilliCream/graphql-platform/releases/tag/v15.2.0
# Look for: ⚠️ BREAKING CHANGE section

# Common issues:
# - Subscription API changes
# - Type registration changes
# - Middleware ordering requirements
```

#### Step 4: Test Schema Generation

```bash
cd backend

# Build to trigger schema emission
dotnet build ./FactoryApp.slnx

# Verify schema.graphql was generated
test -f src/FactoryApp.WebApi/schema.graphql && echo "✓ Schema generated"

# Check for schema diff
git diff src/FactoryApp.WebApi/schema.graphql
```

#### Step 5: Frontend Code Generation

```bash
cd root

# Regenerate frontend types from new schema
pnpm codegen

# Check for TypeScript errors
pnpm --filter frontend run build

# Verify no type mismatches
```

#### Step 6: Run Tests

```bash
dotnet test ./backend/FactoryApp.Tests/FactoryApp.Tests.csproj

# If tests fail, check:
# - GraphQL subscription resolver changes
# - DataLoader registration changes
# - Middleware execution order
```

#### Step 7: Commit & PR

```bash
git add -A
git commit -m "chore: Upgrade Hot Chocolate 15.1 → 15.2

- Update all HotChocolate.* packages to 15.2.0
- Regenerate schema.graphql (no breaking changes)
- Regenerate graphql.ts from new schema
- All tests passing"

git push -u origin upgrade/hot-chocolate-15.2
gh pr create --title "chore: Upgrade Hot Chocolate 15.2"
```

### Scenario 3: EF Core Upgrade (9.0.17 → 9.1.0)

**Type B: Domain Layer** upgrade.

#### Step 1: Create Branch

```bash
git checkout -b upgrade/ef-core-9.1
```

#### Step 2: Update NuGet Packages

```bash
cd backend/src/FactoryApp.Domain

# Update EF Core and related packages
dotnet add package Microsoft.EntityFrameworkCore --version 9.1.0
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 9.1.0
dotnet add package Microsoft.EntityFrameworkCore.Tools --version 9.1.0

# Also update in Test project
cd ../../FactoryApp.Tests
dotnet add package Microsoft.EntityFrameworkCore.SqlServer --version 9.1.0
```

#### Step 3: Check Breaking Changes

```bash
# Review changelog: https://github.com/dotnet/efcore/releases/tag/v9.1.0

# Key questions:
# - Any LINQ query syntax changes?
# - Shadow property handling changes?
# - Cascade delete behavior changes?
# - Migration engine changes?
```

#### Step 4: Migrations Check

```bash
cd backend/src/FactoryApp.WebApi

# List current migrations
dotnet ef migrations list

# Check if new EF version requires migration engine updates
dotnet ef migrations add EFCore9_1_Compatibility
# (Usually not needed for patch versions; delete if scaffolded empty)

git checkout -- Migrations/  # Undo if not needed
```

#### Step 5: Build & Test

```bash
dotnet build ./backend/FactoryApp.slnx

# Integration tests (critical for EF Core)
pnpm docker:up
sleep 10
dotnet test ./backend/FactoryApp.Tests/FactoryApp.Tests.csproj

# Watch for:
# - SQL query changes (check profiler)
# - Performance regressions
# - Transaction handling issues
```

#### Step 6: Commit & PR

```bash
git add -A
git commit -m "chore: Upgrade EF Core 9.0.17 → 9.1.0

- Update Microsoft.EntityFrameworkCore.* packages
- No breaking changes; no migrations needed
- Integration tests pass
- SQL query performance validated"

git push -u origin upgrade/ef-core-9.1
```

---

## Known Incompatibilities

### Hot Chocolate 15.1 + Old Subscriptions

**Issue:** `HotChocolate.Subscriptions` API changed in 15.1

**Symptom:** Compilation error: `ISubscriptionManager not found`

**Fix:**

```bash
# Remove old subscription dependencies
dotnet remove package HotChocolate.Subscriptions.InMemory

# Add new pattern
dotnet add package HotChocolate.Subscriptions
```

### EF Core 9.0 + Dapper Shared Transactions

**Issue:** Dapper transaction compatibility with EF Core changed

**Symptom:** Runtime: `DbConnection not available in transaction context`

**Fix:** Use shared transaction correctly:

```csharp
// ✅ CORRECT
using var transaction = await context.Database.BeginTransactionAsync();
// Use transaction for both EF Core and Dapper
await transaction.CommitAsync();

// ❌ WRONG (would cause incompatibility)
using var transaction = new SqlConnection(...).BeginTransaction();
// EF Core DbContext not aware of transaction
```

### Node.js 18 + Angular 19

**Issue:** Some Angular 19 build optimizations require Node.js 18+

**Symptom:** Build error: `Node.js version 16 or lower not supported`

**Fix:**

```bash
nvm install 18
nvm use 18
pnpm install  # Re-install with correct Node version
```

---

## Rollback Procedures

If an upgrade fails after merge:

### Rollback via Git

```bash
# Option 1: Revert single commit
git revert <commit-hash>
git push origin main

# Option 2: Hard reset (if commit not yet merged to main)
git reset --hard origin/main
```

### Rollback Database (if migrations applied)

```bash
# List migrations in reverse order
dotnet ef migrations list

# Remove last migration
dotnet ef migrations remove

# Re-apply from backup
# (Backup before upgrade: mysqldump or SQL Server backup)
```

### Rollback Package Lock Files

```bash
# Frontend: restore old pnpm-lock.yaml
git checkout <previous-commit> pnpm-lock.yaml
pnpm install

# Backend: restore old *.csproj files
git checkout <previous-commit> backend/**/*.csproj
dotnet restore
```

---

## Monitoring After Upgrade

### Immediate Checks (First Hour)

```bash
# 1. Application starts without errors
pnpm docker:up
pnpm dev

# 2. GraphQL endpoint responds
curl http://localhost:5000/graphql

# 3. Frontend loads
open http://localhost:4200

# 4. Database queries work
# Execute a few GraphQL queries manually
```

### Integration Checks (First Day)

- [ ] All unit tests pass in CI
- [ ] All integration tests pass in CI
- [ ] Schema validation passes
- [ ] No new warning in build logs
- [ ] SQL Server upgrade migrations (if applicable) complete

### Performance Checks (First Week)

- [ ] Benchmark key queries (Build list, Create build, etc.)
- [ ] Monitor database slow query log
- [ ] Check GraphQL query latency (via APM if configured)
- [ ] Memory usage on startup (vs. baseline)

### Observability

```bash
# If using Application Insights or similar:
# Check dashboard for:
# - Exception rates (should be 0 for routine operations)
# - Request latency (should be < baseline + 10%)
# - Dependency failures (should be 0)
```

### Incidents

If issues arise post-upgrade:

1. **Gather logs:**

   ```bash
   dotnet watch run --logger "console;verbosity=detailed"
   ```

2. **Check for regression:**

   ```bash
   # Revert upgrade on feature branch
   git checkout main
   git pull

   # Reproduce issue
   # If issue disappears: upgrade introduced it
   # If issue persists: pre-existing
   ```

3. **Create incident issue:**
   ```bash
   # Document:
   # - Upgrade version
   # - Error message
   # - Reproduction steps
   # - Impact
   ```

---

## Reference: Current Versions

As of 2026-06-30:

```yaml
Backend:
  SDK: .NET 10.0.x
  EF Core: 9.0.17
  Hot Chocolate: 15.1.17
  Elsa: 3.5.3
  BCrypt.Net-Next: 4.0.3
  xUnit: 2.8.1

Frontend:
  Node.js: 18+
  Angular: 19+
  TypeScript: 5.x

Database:
  SQL Server: 2022 (docker image)

Testing:
  Testcontainers.MsSql: 3.8.0
  Moq: 4.20.70
  FluentAssertions: 6.12.0
```

---

## See Also

- [CONTRIBUTING.md - Dependency Layers](../CONTRIBUTING.md#dependency-layers)
- [DEVELOPMENT.md - Local Testing](../DEVELOPMENT.md#testing-locally)
- [ADR 001 - Elsa v3 Isolation](./ADR/001-isolate-elsa-workflows.md)
- [GitHub: Dependabot Alerts](https://github.com/pluto-atom-4/ng-graphql-showcase/security/dependabot)
