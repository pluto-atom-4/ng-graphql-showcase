---
name: Migration Generator
description: Generate and apply EF Core migrations safely with validation
trigger: "/migrate <name>"
atomic: true
scope: database schema changes only
---

# Migration Generator Skill

**Purpose**: Create, validate, and apply EF Core migrations with safety checks.

## Trigger

```
pnpm db:migrate                  # Apply pending migrations
dotnet ef migrations add <Name>  # Create new migration
dotnet ef migrations list        # Show all migrations
```

## Workflow

### 1. Identify Schema Changes

Before running migrations, answer:

- What entity changed? (Build, Part, TestRun, etc.)
- Is it adding/removing/modifying a column?
- Will migration affect existing rows?

### 2. Generate Migration

From WebApi project:

```bash
cd backend/src/FactoryApp.WebApi
dotnet ef migrations add AddBuildStatusTimestamp
```

### 3. Validate Migration

Review generated migration file:

- ✅ Column names match schema
- ✅ Constraints correct (NOT NULL, defaults, indexes)
- ✅ Down() migration reverses changes
- ❌ No hardcoded data transformations (use seed data instead)

### 4. Test Against Real DB

```bash
pnpm docker:up          # Start SQL Server
pnpm db:migrate         # Apply migrations
dotnet test backend/src # Run integration tests
```

**Critical**: Integration tests must pass against real SQL Server. Mocks don't catch migration bugs.

### 5. Commit & Document

- Commit migration file + DbContext changes
- Add migration name to CHANGELOG
- If breaking: document in PR description

## Rollback (If Needed)

```bash
dotnet ef migrations remove    # Undo last migration (uncommitted only!)
```

For committed migrations, create reverse migration:

```bash
dotnet ef migrations add RemoveFailedColumn
# Edit down() to do the actual rollback
```

## Related Rules

See: [[database-rules]], [[backend-patterns]]

## Connection String for Testing

```
Server=localhost,1433;Database=FactoryAppDb_Test;User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=true;
```

Prerequisites: `pnpm docker:up` running
