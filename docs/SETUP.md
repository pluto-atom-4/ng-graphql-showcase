# Local Development Setup Guide

## Overview

This guide covers setting up the **ng-graphql-showcase** monorepo for local development with minimal complexity and maximum iteration speed.

### Architecture

```
┌─────────────────────────────┐
│  Developer Local Machine    │
├─────────────────────────────┤
│                             │
│  Backend (.NET)             │
│  $ npm run dev:backend      │
│  ↓ (Port 5000)              │
│  [dotnet watch run]         │
│                             │
│  Frontend (Angular)         │
│  $ npm run dev:frontend     │
│  ↓ (Port 4200)              │
│  [HMR enabled]              │
│                             │
└────────────┬────────────────┘
             │
┌────────────┴────────────────┐
│  Docker Container           │
│  SQL Server 2022 (1433)     │
│  (Data persisted)           │
└─────────────────────────────┘
```

## Prerequisites

### Required

- **Docker Desktop** — For SQL Server container (required)
  - [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
  - Ensure it's running before starting development

- **.NET SDK 8.0+** — For backend development
  - [Download .NET SDK](https://dotnet.microsoft.com/download)
  - Verify: `dotnet --version`

- **Node.js 18+** — For frontend development
  - [Download Node.js](https://nodejs.org)
  - Verify: `node --version` and `npm --version`

- **Git** — For version control
  - Verify: `git --version`

### Optional

- **JetBrains Rider** — Recommended IDE for full-stack development
  - [Download Rider](https://www.jetbrains.com/rider/)
  - Provides excellent C# debugging, SQL Server tools, and TypeScript support

- **VS Code** — Lightweight alternative
  - [Download VS Code](https://code.visualstudio.com/)
  - Extensions: C# Dev Kit, Thunder Client (REST client)

## First-Time Setup

### 1. Clone Repository

```bash
git clone https://github.com/pluto-atom-4/ng-graphql-ng-graphql-showcase.git
cd ng-graphql-ng-graphql-showcase
```

### 2. Install Node Dependencies

```bash
npm install
```

This installs root-level dependencies and sets up the npm workspace for frontend.

### 3. Start SQL Server & Migrate Database

```bash
npm run setup
```

This command:

1. Starts SQL Server 2022 container in background (`docker-compose up -d`)
2. Waits for container to be ready
3. Runs EF Core migrations to create database schema

**Expected output:**

```
Creating ng-graphql-sql-server ... done
Build started...
Build succeeded.
✅ Setup complete. Run: npm run dev:backend & npm run dev:frontend
```

### 4. Verify SQL Server is Running

```bash
npm run docker:logs
```

You should see SQL Server startup logs without errors.

## Daily Development Workflow

### Terminal 1: Run Backend

```bash
npm run dev:backend
```

This runs `dotnet watch run` in the backend directory with:

- ✅ Hot-reload on file changes (<1 second)
- ✅ Full debugging support in Rider/VS Code
- ✅ GraphQL schema auto-emit to `schema.graphql`

**Expected output:**

```
watch : Started
watch : Building...
watch : Build succeeded.
info: FactoryApp.WebApi starting...
info: GraphQL Playground available at: http://localhost:5000/graphql/playground
```

### Terminal 2: Run Frontend

```bash
npm run dev:frontend
```

This runs `npm run ng serve` with:

- ✅ HMR (Hot Module Replacement) on file changes
- ✅ Type-safe services from GraphQL schema
- ✅ Angular dev server with live reload

**Expected output:**

```
✔ Compiled successfully.
⠙ Compiling...

Application bundle generation complete. [10.234 seconds]

Initial Chunk Files   | Names         |      Size
main.js               | main          | 500.23 kB |
polyfills.js          | polyfills     |  33.45 kB |
styles.css            | styles        |  12.34 kB |

Application bundle generation complete. [3.234 seconds]

✔ Compiled successfully.
```

### 3. Open Application in Browser

Navigate to: **`http://localhost:4200`**

You should see the Angular frontend loaded and able to communicate with the backend at `http://localhost:5000`.

## Common Development Commands

### Docker Management

```bash
# Start SQL Server container (one-time daily setup)
npm run docker:up

# Stop SQL Server container
npm run docker:down

# View SQL Server logs in real-time
npm run docker:logs

# Clean up: Remove containers and all data volumes
npm run docker:clean
```

**⚠️ Warning:** `npm run docker:clean` deletes all database data. Use only when you want a fresh database.

### Database Management

```bash
# Run migrations (automatically done in npm run setup)
npm run db:migrate

# Regenerate GraphQL types from schema
npm run codegen
```

### Full-Stack Commands

```bash
# Build both backend and frontend for production
npm run build

# Run all tests (backend unit tests + frontend tests)
npm run test

# Lint entire codebase
npm run lint
```

## Connection Strings & Environment

### Backend Connection String

**File:** `backend/src/FactoryApp.WebApi/appsettings.Development.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=FactoryDb;User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=True"
  }
}
```

This automatically connects to the Docker SQL Server container on port 1433.

### Frontend API URL

The frontend is configured to call the backend at `http://localhost:5000` (default).

If you need to change this, configure it in your Angular environment files:

- `frontend/src/environments/environment.ts` (local development)
- `frontend/src/environments/environment.prod.ts` (production)

## Troubleshooting

### SQL Server Container Won't Start

```bash
# Check if Docker is running
docker ps

# View detailed logs
npm run docker:logs

# If port 1433 is already in use, stop existing container
docker-compose down

# If container is corrupted, remove it
npm run docker:clean
docker-compose up -d
```

### Backend Won't Compile

```bash
# Clean build artifacts
cd backend/src
dotnet clean
dotnet build

# Restore NuGet packages
dotnet restore
```

### Frontend Won't Start

```bash
# Clean npm cache
cd frontend
npm cache clean --force
rm -rf node_modules
npm install

# Regenerate GraphQL types
npm run codegen

# Try again
npm run ng serve
```

### Migrations Fail

```bash
# Verify SQL Server is running
npm run docker:logs

# Check connection string in appsettings.Development.json
cat backend/src/FactoryApp.WebApi/appsettings.Development.json

# If database is corrupted, start fresh
npm run docker:clean
npm run setup
```

### Port Already in Use

If ports 1433, 5000, or 4200 are already in use:

```bash
# Find and kill process on port 1433
lsof -i :1433
kill -9 <PID>

# For Windows:
netstat -ano | findstr :1433
taskkill /PID <PID> /F
```

## Performance Optimization

### Iteration Speed

- **Backend:** `dotnet watch` provides <1s hot-reload
- **Frontend:** Angular HMR provides <1s hot-reload
- **Database:** SQL Server in Docker with persistent volume

### Debugging

**In JetBrains Rider:**

1. Set breakpoints in C# code
2. Run `npm run dev:backend`
3. Rider automatically attaches debugger
4. Use **Debug Console** to inspect variables

**In VS Code:**

1. Install C# Dev Kit extension
2. Set breakpoints
3. Use F5 or Run → Start Debugging

### Database Performance

If queries are slow, check indexes:

```sql
SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID('Builds');
```

## Architecture Reference

- **Backend:** ASP.NET Core + Hot Chocolate GraphQL + EF Core + Dapper
- **Frontend:** Angular 17+ + Apollo/Urql (GraphQL clients)
- **Database:** Microsoft SQL Server 2022 (Developer Edition)
- **Workflow Engine:** Elsa Workflows v3

See `CLAUDE.md` for detailed architecture documentation.

## Useful Links

- [.NET Documentation](https://docs.microsoft.com/dotnet/)
- [Angular Documentation](https://angular.io/docs)
- [GraphQL Documentation](https://graphql.org/)
- [Docker Documentation](https://docs.docker.com/)
- [JetBrains Rider Documentation](https://www.jetbrains.com/help/rider/)

## Getting Help

- **Issues:** [GitHub Issues](https://github.com/pluto-atom-4/ng-graphql-ng-graphql-showcase/issues)
- **Documentation:** See `README.md` and `CLAUDE.md`
- **Architecture:** See `docs/research-architecuture-design.md`

---

**Last Updated:** 2026-05-19  
**Status:** Active
