# 🏭 ng-graphql-playground

A high-performance, type-safe Full Stack Monorepo designed to manage long-running manufacturing workflows (`Build`, `Parts`, `Test Run`).

This project uses a hybrid data engine to achieve both maximum developer velocity for real-time dashboards and bare-metal ingestion speeds for automated factory machinery.

---

## 🏗️ Architecture Blueprint

```text
        ┌──────────────────────────────────────────────┐
        │         Angular UI (Apollo / Urql)           │
        └──────────────────────┬───────────────────────┘
                               │ ▲
  GraphQL Queries & Mutations  │ │  Real-time Subscriptions
                               ▼ │  (WebSockets / SSE)
         ┌──────────────────────────────────────────────┐
         │        Hot Chocolate GraphQL Gateway         │
         └──────────────────────┬───────────────────────┘
                                │
          Enforces Projections, │ Dispatches High-Frequency
          Filters & DataLoaders │ Telemetry / Dense Audits
                                ▼
         ┌──────────────────────────────────────────────┐
         │           ASP.NET Core Back-End              │
         └──────────────┬────────────────┬──────────────┘
                        │                │
Domain Orchestration /  │                │ High-Velocity Direct SQL
Elsa State Automation   │                │ Execution (Bypass Change Tracker)
                        ▼                ▼
         ┌──────────────────────┐┌──────────────────────┐
         │  Entity Framework    ││                      │
         │      Core Context    ││    Dapper Engine     │
         └──────────────┬───────┘└───────┬──────────────┘
                        │                │
                 Native │                │ Shares Connection &
            ORM Queries │                │ Local ADO.NET Transaction
                        ▼                ▼
         ┌──────────────────────────────────────────────┐
         │           Microsoft SQL Server               │
         └──────────────────────────────────────────────┘
```

---

## 📁 Repository Directory Structure

```text
ng-graphql-playground/
├── /backend                    # .NET 8/9 ASP.NET Core Solution
│   ├── /src
│   │   ├── /FactoryApp.WebApi  # Web API Entry, Hot Chocolate Setup, Elsa 3 Runtime
│   │   │   ├── schema.graphql  # Auto-emitted GraphQL schema file on local build
│   │   ├── /FactoryApp.Domain  # Core entities (Build, Part, TestRun) & Data Context
│   │   ├── /FactoryApp.GraphQL # Hot Chocolate GraphQL Query, Mutation, & DataLoaders
│   │   └── /FactoryApp.Workflows # Elsa 3 Activities & High-Speed Dapper SQL scripts
├── /frontend                   # Angular Workspace
│   ├── /src
│   │   └── /app
│   │       ├── /graphql        # Front-end UI operations definition (.graphql files)
│   │       ├── /api/generated  # Target for GraphQL Code-Gen (Outputs: graphql.ts)
│   │       └── /components     # Smart/Dumb Angular component layouts (OnPush enabled)
│   ├── codegen.ts              # Automatically maps schema.graphql to type-safe TypeScript
│   └── package.json            # Front-end scripts and web dependencies
└── README.md
```

---

## ⚙️ Core Technical Rules

### 1. The Separation of Concerns

- **EF Core** handles all system reads (GraphQL), schema migrations, and **Elsa 3 Workflow Engine** operations. The context defaults to `NoTracking` to match Dapper's read performance.
- **Dapper** is used strictly for high-frequency writes (automated testing metrics, high-speed sorting arrays) to bypass all ORM state overhead.

### 2. The Shared Transaction Rule

When a mutation updates a core asset state via EF Core while logging bulk metrics via Dapper, they
**must** share an explicit ADO.NET transaction context to prevent deadlocks:

```csharp
using var transaction = await context.Database.BeginTransactionAsync();
var dbConnection = context.Database.GetDbConnection();
var dbTransaction = context.Database.CurrentTransaction?.GetDbTransaction();

// Execute Dapper code passing `transaction: dbTransaction` here
// Execute EF Core SaveChangesAsync() here
await transaction.CommitAsync();
```

### 3. Automated Type Safety Pipeline

Type safety is fully automated during a local build. Changing a backend C# DTO or schema updates the pipeline automatically:

1. Compile backend code (`dotnet build`).
2. MSBuild exports the unified `schema.graphql` to disk.
3. The frontend file-watcher triggers **GraphQL Code Generator**.
4. Type-safe Angular services (`graphql.ts`) update automatically.

---

## 🤖 AI Agent Guidance Architecture

This repository uses a **Progressive Disclosure** model for AI agent guidance, minimizing context pollution while maximizing agent effectiveness.

### Structure

**Layer 1: Router** (`./CLAUDE.md`)

- Project overview, stack, NEVER DO THIS section
- Quick-start commands, essential references
- <200 lines, acts as entry point

**Layer 2: Domain Rules** (`.claude/rules/` + `.ai/rules/`)

- `database-rules.md` — Transactions, testing strategy, EF Core + Dapper
- `graphql-patterns.md` — Query depth, entity exposure, type safety pipeline
- `backend-patterns.md` — ASP.NET Core patterns, DataLoaders, projections
- `frontend-patterns.md` — Angular patterns, trackBy, buffering, codegen sync
- `workflow-integration.md` — Elsa v3 state management, activity patterns

**Layer 3: Executable Skills** (`.claude/skills/`)

- `pr-review-workflow/` — Automated PR quality, security, testing checks
- `migration-generator/` — Safe EF Core migration generation
- `codegen-sync/` — Sync schema.graphql → graphql.ts type generation

**Layer 4: Cross-Platform Unification** (`.ai/`)

- Canonical rule location: `.ai/rules/`
- Symlinks: `.claude/rules/` → `.ai/rules/`, `.cursor/rules/` → `.ai/rules/`
- Ensures Claude Code + Cursor use identical guidance

### Usage

1. **Review CLAUDE.md** for quick ref + NEVER DO THIS patterns
2. **Navigate to `.claude/rules/`** for domain-specific deep dives
3. **Use `.claude/skills/`** for automated workflows (migrations, PR reviews, codegen)
4. **Cross-reference** via `[[rule-name]]` links for related patterns

### Why Progressive Disclosure

✅ Agents load context efficiently (router-first)  
✅ Rules isolated by domain (easier to maintain)  
✅ Explicit anti-patterns prevent common mistakes  
✅ Skills codify repeatable workflows  
✅ Unified across Claude Code + Cursor (`.ai/` symlinks)

---

## 🚀 Quickstart Local Environment

### Prerequisites

- [.NET SDK](https://microsoft.com) (Version 8.0 or later)
- [Node.js](https://nodejs.org) (Version 18 or later)
- [pnpm](https://pnpm.io/) (Version 8.0 or later) — Package manager for monorepo
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for SQL Server 2022)

### One-Time Setup

```bash
pnpm install
pnpm setup
# Starts SQL Server container and runs database migrations
```

### Daily Development

**Terminal 1: Backend (.NET with hot-reload)**

```bash
pnpm dev:backend
# Runs: dotnet watch run on Port 5275
```

**Terminal 2: Frontend (Angular with HMR)**

```bash
pnpm dev:frontend
# Runs: pnpm --filter frontend run ng serve on Port 4200
```

**Or run both concurrently:**

```bash
pnpm dev
# Starts both backend and frontend watchers simultaneously
```

**Open browser to:** `http://localhost:4200`

### Access Services

| Service              | URL                                                         |
| -------------------- | ----------------------------------------------------------- |
| **GraphQL Endpoint** | `http://localhost:5275/graphql`                             |
| **Angular Frontend** | `http://localhost:4200`                                     |
| **SQL Server**       | `Server=localhost,1433; User Id=sa; Password=P@ssw0rd1234!` |

### Testing GraphQL API with HTTP Client

Use **JetBrains HTTP Client** to test GraphQL mutations and queries:

**IDE Integration (Recommended for development):**

- **Rider** (C#/.NET) — Built-in, no installation needed
- **WebStorm** (TypeScript/JavaScript) — Built-in, no installation needed
- Open `backend/src/FactoryApp.WebApi/*.http` files → Click Run button in editor gutter

**CLI (For automation/CI/CD):**

```bash
# Install ijhttp (JetBrains HTTP Client CLI)
brew install --cask jetbrains-toolbox  # macOS
# or download ZIP from https://www.jetbrains.com/help/webstorm/http-client-cli.html

# Run requests
ijhttp 01-authentication.http --env-file http-client.env.json
ijhttp 02-create-build.http --env-file http-client.env.json --report
```

**Guide:** [**docs/HTTP-CLIENT-TESTING-GUIDE.md**](./docs/HTTP-CLIENT-TESTING-GUIDE.md) — 8 sections covering IDE + CLI usage, workflows, performance profiling, troubleshooting

### Stop Services

```bash
pnpm docker:down
```

### Full Docker Command Reference

```bash
pnpm docker:up          # Start SQL Server container
pnpm docker:down        # Stop SQL Server container
pnpm docker:clean       # Remove all containers and data volumes
pnpm docker:logs        # View SQL Server logs
pnpm db:migrate         # Run EF Core migrations
```

---

## 🗄️ Database Configuration

### Docker SQL Server (All Platforms)

**Default configuration** — uses Docker container running SQL Server 2022:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=FactoryDb;User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=True"
  }
}
```

Start the container before development:

```bash
pnpm docker:up
sleep 10  # Wait for SQL Server to be ready
pnpm db:migrate
```

### LocalDB (Windows Only)

For Windows development without Docker, use SQL Server LocalDB instead:

1. **Update connection string** in `backend/src/FactoryApp.WebApi/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=FactoryAppDb;Trusted_Connection=true;"
  }
}
```

2. **Run migrations:**

```bash
cd backend/src/FactoryApp.WebApi
dotnet ef database update
```

No Docker required. LocalDB is automatically installed with Visual Studio or SQL Server Express.

---

## 🔧 Entity Framework Core Migrations

### Create a New Migration

When you modify entities in `backend/src/FactoryApp.Domain/Entities/`:

```bash
cd backend/src/FactoryApp.WebApi

# Create migration (auto-detects DbContext changes)
dotnet ef migrations add <MigrationName>
# Example:
dotnet ef migrations add AddBuildStatusHistory
```

This generates a new migration file in `backend/src/FactoryApp.Domain/Migrations/`.

### Apply Migrations

```bash
# Apply all pending migrations
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

### Rollback Migration

If a migration hasn't been applied to production:

```bash
cd backend/src/FactoryApp.WebApi
dotnet ef migrations remove
```

If a migration is already applied to the database, create a new "revert" migration instead.

---

## 🐛 Troubleshooting

### SQL Server Container Not Ready

**Symptom:** `dotnet ef database update` fails with connection timeout

**Solution:**

```bash
# Wait for container to fully initialize (takes 10-15 seconds)
pnpm docker:up
sleep 15
pnpm db:migrate

# Verify container is running
docker ps --filter "name=ng-graphql-sql-server"
```

### Migration Conflicts

**Symptom:** `InvalidOperationException: The value cannot be converted to entity type`

**Causes:**

- Stale or incompatible migration files
- Mismatched DbContext configuration

**Solution:**

```bash
# 1. Check which migrations are applied
dotnet ef migrations list

# 2. Clean and restart (CAUTION: Deletes data)
pnpm docker:clean
pnpm docker:up
sleep 15
pnpm db:migrate
```

### "No targeted SQL Server found at 'localhost,1433'"

**Causes:**

- SQL Server container not running
- Port 1433 blocked by firewall
- Incorrect password in connection string

**Solution:**

```bash
# Restart Docker
pnpm docker:down
pnpm docker:clean
pnpm docker:up
sleep 15

# Verify connectivity
docker logs ng-graphql-sql-server  # Check container logs
```

### Entity Framework Tools Not Found

**Symptom:** `dotnet ef: command not found`

**Solution:**

```bash
# Install EF Core CLI tools globally
dotnet tool install --global dotnet-ef

# Verify installation
dotnet ef --version
```

---

For comprehensive setup instructions, see [**docs/SETUP.md**](./docs/SETUP.md)
