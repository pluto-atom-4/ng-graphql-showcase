# Manufacturing Monorepo: Best Practice Assessment

## 1. IDE Selection: JetBrains Rider

### ✅ **Rider is EXCELLENT for this architecture**

**Strengths:**

- **Native C# Support:** First-class support for .NET projects, EF Core migrations, Hot Chocolate GraphQL debugging
- **Database Tools:** Built-in SQL Server profiler and query analysis (critical for Dapper/EF Core optimization)
- **Full-Stack Debugging:** Can debug backend GraphQL resolvers while inspecting frontend network requests
- **Monorepo Integration:** Native support for multiple project types in one workspace
- **GraphQL Schema Inspection:** Hot Chocolate schema validation and autocomplete
- **Workflow Visualization:** Good integration with async/await patterns and Elsa workflow debugging

**Why NOT alternatives:**

- **VS Code:** Limited C# debugging, weak EF Core tooling, GraphQL support requires extensions
- **Visual Studio Community:** Heavier than Rider, overkill for monorepo complexity
- **Neovim/Vim:** Lacks integrated database tools needed for hybrid EF Core + Dapper debugging

### Recommendation

**Use JetBrains Rider 2024.x+ with:**

- Ultimate Edition (includes database tools)
- .NET 8+ SDK configured
- Hot Chocolate plugin for enhanced GraphQL support
- Elsa Workflow debugging extensions

---

## 2. Monorepo Tool Strategy

### Your Hybrid Stack Challenge

```
Backend:    C# / .NET (Solutions, Projects, NuGet)
Frontend:   TypeScript / Node.js (npm/yarn/pnpm)
Orchestration: Need cross-platform build coordination
```

### Recommended Tooling Stack

#### **Primary: NX Monorepo (RECOMMENDED)**

**Why NX for this architecture:**

- ✅ Designed for polyglot monorepos (C# + TypeScript)
- ✅ Task graph execution & caching
- ✅ Incremental builds (rebuild only changed projects)
- ✅ Workspace dependency tracking
- ✅ Scalable to enterprise monorepos

**Setup:**

```bash
# Install NX in root using pnpm
pnpm add -D nx@latest

# Add plugins to manage both backend and frontend
pnpm exec nx add @nx/dotnet   # For C# project orchestration
pnpm exec nx add @nx/angular  # Already using Angular
```

**Benefits:**

- Single `pnpm exec nx build` command builds both backend + frontend
- Automatic dependency detection (frontend depends on backend schema)
- Shared linting/testing configuration
- CI/CD integration simplification

---

#### **Secondary: Package Managers**

| Tool               | Use Case                               | Recommendation                              |
| ------------------ | -------------------------------------- | ------------------------------------------- |
| **pnpm** (Current) | Faster, stricter dependency management | ✅ Best choice for workspace isolation      |
| **npm**            | Node.js monorepo standard              | ❌ Replaced by pnpm for speed and stability |
| **Bun**            | All-in-one runtime                     | ❌ Not production-ready for .NET monorepos  |
| **Python (uv)**    | Not applicable                         | ❌ No Python in your stack                  |

**Conclusion:** Use **pnpm** to ensure fast, strict dependency resolution across monorepo workspaces.

---

#### **Tertiary: Build Orchestration Scripts**

Create root-level build scripts (instead of tool dependency):

```json
{
  "scripts": {
    "build": "pnpm build:backend && pnpm build:frontend",
    "build:backend": "dotnet build ./backend/src/FactoryApp.sln",
    "build:frontend": "pnpm --filter frontend run build",
    "dev": "concurrently \"pnpm dev:backend\" \"pnpm dev:frontend\"",
    "dev:backend": "cd backend/src/FactoryApp.WebApi && dotnet watch run",
    "dev:frontend": "pnpm --filter frontend run ng serve",
    "test": "pnpm test:backend && pnpm test:frontend",
    "test:backend": "dotnet test ./backend/src",
    "test:frontend": "pnpm --filter frontend run test"
  }
}
```

---

## 3. Directory Structure Optimization

### Current Structure Assessment: **Good, but can be enhanced**

**Improvements:**

```text
/manufacturing-monorepo
├── .nx/                          # NX configuration cache
├── tools/                         # Shared scripts & utilities
│   ├── scripts/
│   │   ├── generate-types.sh     # GraphQL code-gen orchestration
│   │   ├── build-all.sh
│   │   └── docker-compose.yml    # Local dev SQL Server + services
│   ├── workspace.json            # NX workspace configuration
│   └── nx.json                   # NX settings
├── backend/
│   ├── src/
│   │   ├── FactoryApp.WebApi/
│   │   ├── FactoryApp.Domain/
│   │   ├── FactoryApp.GraphQL/
│   │   ├── FactoryApp.Workflows/
│   │   ├── FactoryApp.Tests/    # Add unit tests here
│   │   └── FactoryApp.sln
│   ├── docker/                   # Backend-specific Docker configs
│   └── README.md                 # Backend-specific setup
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── graphql/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── services/         # Shared services layer
│   │   │   └── models/           # Shared TypeScript types
│   │   ├── environments/         # Environment configs
│   │   └── assets/
│   ├── package.json
│   ├── codegen.ts                # GraphQL code-gen config
│   ├── angular.json
│   ├── tsconfig.json
│   └── README.md
├── docs/                         # Shared documentation
│   ├── ARCHITECTURE.md           # Your current research-architecture-design.md
│   ├── SETUP.md                  # Local dev setup instructions
│   └── DEPLOYMENT.md
├── .github/workflows/            # CI/CD pipelines
│   ├── backend-tests.yml
│   ├── frontend-tests.yml
│   └── deploy.yml
├── docker-compose.yml            # Local development stack
├── package.json                  # Root workspace config
├── pnpm-workspace.yaml           # (if using pnpm)
├── .gitignore
├── README.md                     # Root documentation
└── CONTRIBUTING.md               # Development guidelines
```

---

## 4. Development Workflow Best Practices

### Local Setup (Developer Onboarding)

```bash
# 1. Clone repo
git clone https://github.com/yourorg/manufacturing-monorepo.git
cd manufacturing-monorepo

# 2. Install all dependencies
npm install

# 3. Setup .NET backend
cd backend
dotnet restore
dotnet build

# 4. Setup frontend
cd ../frontend
npm install

# 5. Start local dev stack
cd ..
docker-compose up -d  # SQL Server + any other services
npm run dev           # Starts both backend + frontend watchers
```

### CI/CD Pipeline Structure

```yaml
# .github/workflows/monorepo-ci.yml
name: Monorepo CI

on: [push, pull_request]

jobs:
  backend-test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: "8.0"
      - run: dotnet build ./backend/src/FactoryApp.sln
      - run: dotnet test ./backend/src

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: npm run lint --workspace=frontend
      - run: npm run test --workspace=frontend

  codegen-sync:
    needs: [backend-test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run generate:types # Verify types stay in sync
```

---

## 5. Dependency Management Strategy

### Backend (.NET)

- **NuGet:** Package manager for C# dependencies
- **Pinned versions** in .csproj files for stability
- **Central Package Management** (CentralPackageVersions)

```xml
<!-- Directory.Packages.props -->
<ItemGroup>
  <PackageReference Include="HotChocolate.AspNetCore" Version="14.1.0" />
  <PackageReference Include="Elsa.Workflows" Version="3.0.0" />
  <PackageReference Include="Dapper" Version="2.1.0" />
</ItemGroup>
```

### Frontend (Node.js)

- **pnpm:** Use workspaces for monorepo tracking
- **pnpm-lock.yaml:** Commit for reproducible builds
- **pnpm install --frozen-lockfile** in CI/CD (replaces `npm ci`)

```yaml
# pnpm-workspace.yaml
packages:
  - "frontend"
```

---

## 6. Tool Recommendations Summary

| Aspect                     | Recommendation                                   | Rationale                              |
| -------------------------- | ------------------------------------------------ | -------------------------------------- |
| **IDE**                    | JetBrains Rider Ultimate 2024+                   | Best C# + TypeScript + DB tooling      |
| **Monorepo Orchestration** | NX (optional) or pnpm scripts                    | NX for scale, pnpm for simplicity      |
| **Backend Build**          | `dotnet build` + MSBuild                         | Native .NET ecosystem                  |
| **Frontend Build**         | `pnpm --filter frontend run build` (Angular CLI) | Industry standard                      |
| **Package Manager**        | pnpm (Current)                                   | Faster, stricter dependency management |
| **Local Development**      | docker-compose + pnpm scripts                    | Easy multi-service coordination        |
| **CI/CD**                  | GitHub Actions (you have it!)                    | Native to GitHub, free                 |
| **Versioning**             | Semantic Versioning (SemVer)                     | Communicate breaking changes           |

---

## 7. Avoid Common Pitfalls

❌ **Do NOT:**

- Use Bun in production for .NET monorepos (immature for hybrid stacks)
- Introduce Python (uv) without a specific reason (adds dependency management complexity)
- Switch package managers frequently (npm → pnpm → yarn churn)
- Forget to commit lock files (breaks reproducible builds)
- Ignore workspace-level root scripts (every developer should run same `npm run dev`)

✅ **DO:**

- Enforce consistent local environments (Docker for SQL Server)
- Automate schema synchronization (GraphQL code-gen as pre-commit hook)
- Keep monorepo README updated with onboarding steps
- Use `.editorconfig` for cross-tool formatting
- Run linters + tests on every commit (pre-commit hooks)

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)

- [ ] Set up root `package.json` with npm workspace
- [ ] Create root-level npm scripts for `build`, `dev`, `test`
- [ ] Document setup in `/docs/SETUP.md`
- [ ] Add `.editorconfig` + `prettier.config.js` for consistency

### Phase 2: Automation (Week 2)

- [ ] Set up GitHub Actions CI/CD pipelines
- [ ] Add pre-commit hooks (husky + lint-staged)
- [ ] Automate GraphQL code generation on backend build

### Phase 3: Optimization (Week 3+)

- [ ] Consider NX adoption if monorepo grows
- [ ] Add workspace linting rules (eslint shared config)
- [ ] Implement Docker build layer optimization
