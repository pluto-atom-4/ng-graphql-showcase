# Database Setup & Migrations

Configuration, migration management, and troubleshooting for Microsoft SQL Server.

---

## Database Targets

### Docker SQL Server (All Platforms)

**Default development environment** — runs SQL Server 2022 in Docker container.

**Connection String** (in `appsettings.Development.json`):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=FactoryDb;User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=True"
  }
}
```

**Setup:**

```bash
pnpm docker:up              # Start container
sleep 10                    # Wait for SQL Server to initialize
pnpm db:migrate             # Apply EF Core migrations
```

### LocalDB (Windows Only)

Windows developers can use SQL Server LocalDB without Docker.

**Connection String** (update `appsettings.Development.json`):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FactoryAppDb;Trusted_Connection=true;"
  }
}
```

**Setup:**

```bash
cd backend/src/FactoryApp.WebApi
dotnet ef database update
```

LocalDB is automatically installed with Visual Studio 2022 or SQL Server Express.

---

## Entity Framework Core Migrations

### Create a New Migration

When you modify domain entities, create a migration:

```bash
cd backend/src/FactoryApp.WebApi

# Create migration (auto-detects DbContext changes)
dotnet ef migrations add AddBuildPriorityField
```

This generates:

- `Migrations/<timestamp>_AddBuildPriorityField.cs` — Migration logic (Up/Down)
- `Migrations/<timestamp>_AddBuildPriorityField.Designer.cs` — Metadata snapshot
- `Migrations/FactoryDbContextModelSnapshot.cs` — Current model state

**Always commit migration files to version control.**

### Apply Migrations

```bash
# Apply all pending migrations to database
pnpm db:migrate

# Or manually:
cd backend/src/FactoryApp.WebApi
dotnet ef database update
```

### List Applied Migrations

```bash
cd backend/src/FactoryApp.WebApi
dotnet ef migrations list
```

Output example:

```
20260615234044_InitialCreate
20260616100512_AddBuildPriorityField
```

### Rollback Migration

**If NOT applied to production:**

```bash
cd backend/src/FactoryApp.WebApi
dotnet ef migrations remove
```

Removes the most recent migration file and updates the model snapshot.

**If ALREADY applied to production:**

Create a new "revert" migration instead:

```bash
dotnet ef migrations add RemoveBuildPriorityField
# Edit the migration to drop the column
dotnet ef database update
```

### Updating an Applied Migration

Cannot edit an already-applied migration. Instead:

```bash
dotnet ef migrations remove              # Remove pending migration
# Edit the entity
dotnet ef migrations add UpdatedName     # Create new migration with changes
dotnet ef database update                # Apply
```

---

## Schema Design

### Domain Entities

**Build** (Aggregate Root)

```sql
CREATE TABLE [dbo].[Builds] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [Name] NVARCHAR(256) NOT NULL,
    [Description] NVARCHAR(1000) NULL,
    [Status] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL,
    [UpdatedAt] DATETIME2 NOT NULL
)

CREATE INDEX [IX_Builds_Status] ON [dbo].[Builds]([Status]);
CREATE INDEX [IX_Builds_CreatedAt] ON [dbo].[Builds]([CreatedAt]);
```

**Part** (Child Entity)

```sql
CREATE TABLE [dbo].[Parts] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [BuildId] UNIQUEIDENTIFIER NOT NULL,
    [Name] NVARCHAR(256) NOT NULL,
    [SKU] NVARCHAR(100) NOT NULL,
    [Quantity] INT NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [FK_Parts_Builds_BuildId] FOREIGN KEY ([BuildId])
        REFERENCES [dbo].[Builds]([Id]) ON DELETE CASCADE
)

CREATE INDEX [IX_Parts_BuildId] ON [dbo].[Parts]([BuildId]);
CREATE INDEX [IX_Parts_SKU] ON [dbo].[Parts]([SKU]);
```

**TestRun** (Child Entity)

```sql
CREATE TABLE [dbo].[TestRuns] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [BuildId] UNIQUEIDENTIFIER NOT NULL,
    [Status] INT NOT NULL,
    [Result] NVARCHAR(2000) NULL,
    [FileUrl] NVARCHAR(500) NULL,
    [CompletedAt] DATETIME2 NULL,
    [CreatedAt] DATETIME2 NOT NULL,
    [UpdatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [FK_TestRuns_Builds_BuildId] FOREIGN KEY ([BuildId])
        REFERENCES [dbo].[Builds]([Id]) ON DELETE CASCADE
)

CREATE INDEX [IX_TestRuns_BuildId] ON [dbo].[TestRuns]([BuildId]);
CREATE INDEX [IX_TestRuns_Status] ON [dbo].[TestRuns]([Status]);
```

**AuthUser**

```sql
CREATE TABLE [dbo].[AuthUsers] (
    [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    [Email] NVARCHAR(256) NOT NULL,
    [PasswordHash] NVARCHAR(256) NOT NULL
)

CREATE UNIQUE INDEX [IX_AuthUsers_Email] ON [dbo].[AuthUsers]([Email]);
```

### Relationships

- **Build → Parts**: 1-to-many, cascade delete
- **Build → TestRuns**: 1-to-many, cascade delete
- **Part ← Build**: many-to-1 (required FK)
- **TestRun ← Build**: many-to-1 (required FK)

---

## Testing Strategy

### Backend (Unit + Integration)

```bash
dotnet test backend/src
```

**Unit Tests** (in-memory):

- Entity validation
- Service logic (calculations, state transitions)
- GraphQL resolver mapping

**Integration Tests** (real database):

- EF Core + Dapper interactions
- Transaction atomicity
- Foreign key constraints
- Cascade delete behavior

**Key Rule:** Use a real SQL Server LocalDB instance for integration tests. Avoid mocking the database—caught bugs in production when mocks diverged from actual SQL Server behavior.

### Frontend (Component + E2E)

```bash
pnpm --filter frontend run test
```

**Component Tests** (Vitest + Testing Library):

- Angular component rendering
- User interaction (clicks, form submission)
- RxJS subscription handling

**E2E Tests:**

- Mock GraphQL responses
- Test against staging backend running full Hot Chocolate gateway

---

## Troubleshooting

### SQL Server Container Not Ready

**Symptom:** `dotnet ef database update` fails with connection timeout

**Cause:** Container initialization takes 10-15 seconds

**Solution:**

```bash
pnpm docker:up
sleep 15                    # Wait for SQL Server to fully start
pnpm db:migrate

# Verify container is running and healthy
docker ps --filter "name=ng-graphql-sql-server"

# Check container logs
docker logs ng-graphql-sql-server
```

### Migration Conflicts

**Symptom:** `InvalidOperationException: The value cannot be converted to entity type`

**Causes:**

- Stale or incompatible migration files
- Mismatched DbContext configuration
- Schema changes not reflected in migration

**Solution:**

```bash
# 1. List applied migrations
dotnet ef migrations list

# 2. Check which is pending
dotnet ef migrations script --from <LastAppliedMigration>

# 3. Clean and restart (CAUTION: Deletes all data)
pnpm docker:clean
pnpm docker:up
sleep 15
pnpm db:migrate
```

### "No targeted SQL Server found at 'localhost,1433'"

**Causes:**

- SQL Server container not running
- Port 1433 blocked by firewall or already in use
- Wrong password in connection string

**Solution:**

```bash
# Verify container is running
docker ps --filter "name=ng-graphql-sql-server"

# If not running, restart
pnpm docker:down
pnpm docker:clean
pnpm docker:up
sleep 15

# Check container startup logs
docker logs ng-graphql-sql-server | tail -30

# Test connection manually
sqlcmd -S localhost,1433 -U sa -P P@ssw0rd1234! -Q "SELECT 1"
```

### Entity Framework Tools Not Found

**Symptom:** `dotnet ef: command not found`

**Solution:**

```bash
# Install EF Core CLI tools globally (one-time)
dotnet tool install --global dotnet-ef

# Verify installation
dotnet ef --version

# If already installed, update to latest
dotnet tool update --global dotnet-ef
```

### Migration File Conflicts (Git Merge)

**Symptom:** Two developers create migrations simultaneously, causing filename conflicts

**Resolution:**

```bash
# 1. Rename one migration (keep alphabetical order by timestamp)
git mv 20260616120000_FeatureA.cs 20260616120001_FeatureA.cs

# 2. Update the Designer filename
git mv 20260616120000_FeatureA.Designer.cs 20260616120001_FeatureA.Designer.cs

# 3. Regenerate the model snapshot
dotnet ef migrations script

# 4. Apply both migrations
pnpm db:migrate
```

---

## Best Practices

1. **One Migration Per Feature**
   - Small, atomic changes are easier to debug and rollback

2. **Never Edit Applied Migrations**
   - If needed, create a new "revert" migration instead

3. **Always Commit Migration Files**
   - Ensures team consistency; enables CI/CD automation

4. **Test Migrations Locally First**
   - `pnpm db:migrate` on your machine before pushing

5. **Use Meaningful Migration Names**

   ```bash
   # ✅ Good
   dotnet ef migrations add AddBuildPriorityFieldWithIndex

   # ❌ Vague
   dotnet ef migrations add Update
   ```

6. **Validate Generated SQL**
   - Review the migration's Up/Down SQL before applying
   - Watch for unexpected schema changes

---

## References

- **README.md** — Quickstart, service URLs
- **docs/ARCHITECTURE.md** — EF Core vs Dapper patterns
- **docs/DEVELOPMENT.md** — IDE debugging with databases
