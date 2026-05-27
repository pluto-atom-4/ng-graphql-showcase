# Contributing Guidelines

## Overview

This is a **solo developer** project managed by @pluto-atom-4. This guide describes the development workflow, code standards, and security practices.

For AI code generation and GitHub Copilot usage, see [.github/copilot-instructions.md](.github/copilot-instructions.md).

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [GitHub Copilot CLI Setup](#github-copilot-cli-setup)
3. [Implementation Flow](#implementation-flow)
4. [Development Workflow](#development-workflow)
5. [Code Standards](#code-standards)
6. [Testing](#testing)
7. [Commit Messages](#commit-messages)
8. [Security](#security)
9. [Pull Request Process](#pull-request-process)
9. [Code Review](#code-review)

---

## Getting Started

### Prerequisites

- Git
- Node.js 18+ (for frontend)
- .NET 8+ (for backend)
- Docker & Docker Compose (for SQL Server)
- Visual Studio Code or JetBrains Rider

### Local Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/pluto-atom-4/ng-graphql-playground.git
   cd ng-graphql-playground
   ```

2. **Follow setup guide**
   ```bash
   # See docs/SETUP.md for detailed instructions
   # Quick start:
   pnpm install           # Install dependencies
   pnpm setup            # Start Docker + initialize DB
   pnpm dev              # Start backend + frontend watchers
   ```

3. **Verify setup**
   ```bash
   # Backend should be running at http://localhost:5000
   # Frontend should be running at http://localhost:4200
   # SQL Server at localhost:1433
   ```

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

---

## GitHub Copilot CLI Setup

**GitHub Copilot CLI** extends your terminal with AI-powered development assistance, including access to custom skills and plugins.

### Prerequisites

- GitHub Copilot subscription (or free trial)
- GitHub CLI (`gh`) v2.30.0+
- GitHub authentication: `gh auth login`

### Installation

GitHub Copilot CLI is automatically available through GitHub CLI:

```bash
# Verify installation
gh copilot --version

# If not installed, download:
gh copilot update
```

### Enable Project Skills (Claude Code)

This repository is pre-configured with skills in `.claude/settings.json`:

```bash
# View enabled skills
cat .claude/settings.json

# Available skills:
# - factory-app-session-blog (document architectural work)
# - fix-github-issues (automated issue fixing)
# - example-skills:session-blog-to-gist (convert work to blog posts)
# - example-skills:push-feature-branch (create branches and push)
# - example-skills:doc-coauthoring (collaborative documentation)
# - update-config (configure Copilot settings)
# - secure-github-repo (GitHub security hardening)
```

Start using Copilot CLI in this directory:

```bash
# Interactive mode (full featured)
gh copilot

# Non-interactive mode (single request)
gh copilot -p "Fix the bug in the shared transaction pattern"

# Ask for explanations
gh copilot -i "Explain how the type-safety pipeline works"
```

### Install GitHub Copilot CLI Plugins

To access additional skills (like `factory-app-session-blog`), install plugins:

```bash
# Install the factory-app plugin
gh copilot -- plugin install pluto-atom-4/copilot-plugin-factory-app

# Verify installation
gh copilot -- plugin list

# Use plugins in sessions
gh copilot -i "Use the factory-app-session-blog skill to document this work"
```

**For more information:**
- [GitHub Copilot CLI Documentation](https://docs.github.com/copilot/how-tos/copilot-cli)
- [Plugin System Guide](https://docs.github.com/copilot/concepts/agents/copilot-cli/about-cli-plugins)
- [CLAUDE.md - Detailed Skill Configuration](CLAUDE.md)

---

## Implementation Flow

### Overview

All GitHub issue implementations follow a **standardized Git feature branch pattern** that includes:
- Feature branch naming conventions
- Implementation plan with file manifest tracking
- Implementation criteria checklist
- Phase-based delivery structure
- Mandatory PR review (following Issue #19 procedure)

This ensures **traceability, consistency, and clear deliverables** for every implementation.

### Feature Branch Naming

```
feat/issue-<number>-<kebab-case-description>

Examples:
- feat/issue-22-implementation-flow
- feat/issue-9-design-to-code-workflow
- feat/issue-10-container-service
```

### Implementation Plan Structure

Every GitHub issue implementation requires a comprehensive implementation plan in `docs/implementation-planning/`:

**Required Sections**:
1. **Issue Information**: Issue number, feature branch, status
2. **Executive Summary**: 2-3 sentence overview
3. **Problem Statement**: What problem are we solving
4. **Solution Approach**: High-level solution
5. **Implementation Criteria**: Checklist (mandatory criteria before merge)
6. **File Manifest**: Track all created/modified files
7. **Phases** (if multi-phase): Goals, tasks, deliverables per phase
8. **Acceptance Criteria**: Verification table
9. **Next Steps**: Clear action items

### File Manifest Tracking

The file manifest provides complete auditability:

```markdown
## File Manifest

### Files Created
| File Path | Purpose | Status |
|-----------|---------|--------|
| docs/new-file.md | Description | ✅ |

### Files Modified
| File Path | Changes | Status |
|-----------|---------|--------|
| README.md | Added section | ✅ |

### Files Deleted
| File Path | Reason |
|-----------|--------|
| (none) | N/A |
```

Status options: ✅ (Done), ⏳ (In Progress), ❌ (Blocked), 🔄 (Pending Review)

### Implementation Criteria (Mandatory)

All implementations must meet these criteria before merge:

- [ ] Code passes linting: `pnpm lint`
- [ ] All tests pass: `pnpm test`
- [ ] TypeScript strict mode: No type errors
- [ ] Security: No secrets, credentials, or API keys in code
- [ ] Documentation: README, CONTRIBUTING, relevant docs updated
- [ ] Backwards compatibility: No breaking changes (unless documented)
- [ ] Performance: No performance regressions
- [ ] Code review: Passed PR review (Issue #19 procedure)
- [ ] File manifest: Matches actual created/modified files
- [ ] Acceptance criteria: All items verified

### Implementation Workflow

```
1. Create/Enhance GitHub Issue
   ↓
2. Create feature branch: feat/issue-N-...
   ↓
3. Create implementation plan in docs/implementation-planning/
   ├─ Include criteria
   ├─ Include file manifest
   ├─ Include phase structure (if needed)
   └─ Include acceptance criteria
   ↓
4. Implement features on branch
   └─ Update file manifest as you create/modify files
   ↓
5. Run tests & linting locally
   ↓
6. Create PR + push to remote
   ↓
7. Code review (following Issue #19 mandatory procedure)
   ├─ Phase 1: Analyze PR details
   ├─ Phase 2: Review code + file manifest
   └─ Phase 3: Post review comment to GitHub (MANDATORY)
   ↓
8. Merge PR to main
   ↓
9. Close issue with link to commit/PR
```

### Quick Start for Implementers

```bash
# 1. Create feature branch
git checkout main && git pull
git checkout -b feat/issue-<N>-<kebab-case-title>

# 2. Copy implementation plan template
cp .github/copilot/templates/IMPLEMENTATION_PLAN_TEMPLATE.md \
   docs/implementation-planning/issue-<N>-<name>.md

# 3. Fill in your issue details in the implementation plan

# 4. Implement features & update file manifest as you go

# 5. Run checks before creating PR
pnpm format                           # Auto-format code
pnpm lint                             # Check for style issues
pnpm test                             # Run tests

# 6. Commit and push
git add .
git commit -m "feat: Implement Issue #<N> - Description"
git push -u origin feat/issue-<N>-<kebab-case-title>

# 7. Create PR (link will appear in git output)
```

### Resources

- **Template**: [docs/IMPLEMENTATION_PLAN_TEMPLATE.md](docs/IMPLEMENTATION_PLAN_TEMPLATE.md)
- **Implementation Flow Guide**: [docs/IMPLEMENTATION_FLOW.md](docs/IMPLEMENTATION_FLOW.md)
- **PR Review Procedure**: [Issue #19 / .github/copilot/rules/pr-review-workflow.md](.github/copilot/rules/pr-review-workflow.md)
- **Example Implementation**: [Issue #9 / docs/implementation-planning/issue-9-design-to-code-workflow.md](docs/implementation-planning/issue-9-design-to-code-workflow.md)

---

## Development Workflow

### 1. Create Feature Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch (descriptive name)
git checkout -b feat/your-feature-name
# or: fix/bug-description, docs/documentation-update, etc.
```

**Branch naming convention:**
- `feat/feature-name` — New feature
- `fix/bug-description` — Bug fix
- `docs/documentation-update` — Documentation changes
- `refactor/code-cleanup` — Code refactoring
- `test/test-addition` — Test additions
- `chore/maintenance-task` — Maintenance/tooling

### 2. Make Changes

**Backend (.NET):**
```bash
cd backend/src/FactoryApp.WebApi
dotnet watch run
# Code with live reload
```

**Frontend (Angular):**
```bash
pnpm --filter frontend run ng serve
# Code with HMR (Hot Module Replacement)
```

### 3. Run Tests Locally

```bash
# Backend tests
pnpm test:backend

# Frontend tests
pnpm test:frontend

# Lint all
pnpm lint
```

### 3.5 Pre-Commit Hooks

**Automatic Code Quality Checks**

This project uses **Husky + lint-staged** to automatically enforce code quality before commits:

```bash
git commit -m "feat: Add feature"
# ↓ Pre-commit hook runs automatically
# ↓ Formats code with Prettier
# ✅ Commit allowed if all checks pass
# ❌ Commit rejected if any check fails
```

**Prerequisites (First-Time Setup):**

```bash
# Install all dependencies (required before hooks work)
pnpm install

# The prepare script auto-installs Husky hooks:
# $ husky install
```

**Current Checks:**

- ✅ **Markdown Formatting:** Prettier auto-fixes code style
- ✅ **JSON/YAML Formatting:** Prettier auto-fixes configuration files
- ✅ **File patterns:** Only checks files you modified (staged files)

**Future Checks (When Code Structure Added):**

- 🔄 **Frontend TypeScript/HTML:** Prettier + ESLint (configured, awaiting `frontend/src/` scaffold)
- 🔄 **Backend C# Formatting:** `dotnet format` verification (configured, awaiting `backend/src/**/*.cs` code)

See [Issue #9 (Design-to-Code Workflow)](https://github.com/pluto-atom-4/ng-graphql-playground/issues/9) for frontend scaffolding timeline.

**If a check fails:**

1. The commit is rejected
2. Errors are displayed with fixes applied (when possible)
3. Re-stage and commit: `git add . && git commit`
4. If you fixed all issues, the commit succeeds

**Bypass pre-commit hooks** (for CI/CD or emergency):

```bash
# Skip pre-commit hooks one time
git commit --no-verify -m "feat: Emergency hotfix"

# Useful for: CI/CD automation, cherry-picks, rebases
```

**Troubleshooting:**

| Issue | Solution |
|-------|----------|
| "Pre-commit hooks fail on first clone" | Run `pnpm install` to install dependencies and Husky hooks |
| "command not found: pnpm" | Run `pnpm install` to reinstall dependencies |
| "prettier: command not found" | Run `pnpm install` to ensure prettier is installed |
| "Hook takes too long" | Reduce scope: only commit related files |
| "Permission denied on .husky/pre-commit" | Run: `chmod +x .husky/pre-commit` |
| ".husky/ not found after clone" | Run `pnpm install` (prepare script installs hooks) |

**Backend C# Developers:**

Pre-commit hooks verify C# formatting via `dotnet format` using the project's `.editorconfig` rules (see root `.editorconfig`):

```bash
# When backend/src/**/*.cs files are added to the repository:
git add backend/src/FactoryApp.Domain/Build.cs
git commit -m "feat: Add BuildStatus property"
# ↓ Pre-commit hook runs
# ↓ dotnet format verifies formatting rules from .editorconfig
# ✅ Commit allowed if formatting is correct
# ❌ Commit rejected if style violations found

# If rejected, auto-fix and recommit:
dotnet format ./backend/src/FactoryApp.sln
git add .
git commit -m "feat: Add BuildStatus property"
```

**Note:** StyleCop analyzers and FxCop security checks run at **build-time** (`dotnet build`), not pre-commit, to keep pre-commit hooks fast and focused on formatting.

---

### 4. Commit Changes

```bash
git add .
git commit -m "feat: Add new manufacturing workflow feature"
```

See [Commit Messages](#commit-messages) for guidelines.

### 5. Push & Create PR

```bash
git push origin feat/your-feature-name
```

Then create a PR on GitHub:
```bash
gh pr create --title "feat: Add new manufacturing workflow feature"
```

---

## Code Standards

### Backend (.NET)

**C# Code Style:**
- PascalCase for class names and methods
- camelCase for local variables and parameters
- Use meaningful names (no abbreviations)
- Max line length: 120 characters
- Follow [Microsoft C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)

**Example:**
```csharp
public class BuildService
{
    private readonly ILogger<BuildService> _logger;
    
    public async Task<Build> CreateBuildAsync(CreateBuildRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        
        var build = new Build 
        { 
            Id = Guid.NewGuid(),
            Name = request.Name
        };
        
        return build;
    }
}
```

**Database:**
- Use Entity Framework Core for domain models
- Use Dapper only for high-velocity telemetry writes
- Always share transactions for multi-step operations
- Include XML documentation on public APIs

### Frontend (Angular)

**TypeScript Code Style:**
- PascalCase for classes
- camelCase for variables and functions
- Use strict TypeScript mode (`strict: true`)
- Enable strict template checking in Angular
- Use OnPush change detection strategy

**Example:**
```typescript
@Component({
  selector: 'app-build-list',
  templateUrl: './build-list.component.html',
  styleUrls: ['./build-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BuildListComponent {
  builds$: Observable<Build[]>;

  constructor(private buildService: BuildService) {
    this.builds$ = this.buildService.getAllBuilds();
  }
}
```

### General Standards

- **No magic numbers** — Use named constants
- **Comments** — Only for "why", not "what"
- **Null checks** — Use guards or null coalescing
- **Error handling** — Specific exceptions, not generic
- **Configuration** — Use environment variables, not hardcoded values

---

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test:frontend -- --include='**/build.service.spec.ts'

# Run with coverage
pnpm test:frontend -- --coverage
```

### Test Standards

**Unit tests:**
- Every public method should have tests
- Test happy path, edge cases, and errors
- Use descriptive test names
- Follow Arrange-Act-Assert pattern

**Example:**
```typescript
describe('BuildService', () => {
  it('should create a build with valid request', () => {
    // Arrange
    const request: CreateBuildRequest = { name: 'Build 1' };
    
    // Act
    const result = service.createBuild(request);
    
    // Assert
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Build 1');
  });

  it('should throw error for null request', () => {
    // Assert
    expect(() => service.createBuild(null)).toThrowError();
  });
});
```

### CI/CD Testing

All tests run automatically on:
- Push to any branch (pre-PR testing)
- PR creation
- PR updates (new commits)

**Tests must pass before PR can merge.**

---

## Commit Messages

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation changes
- `style` — Code style changes (formatting, semicolons, etc.)
- `refactor` — Code refactoring without feature changes
- `perf` — Performance improvements
- `test` — Test additions or updates
- `chore` — Build process, dependencies, tooling

### Scope (Optional)

Brief category:
- `backend` — Backend/API changes
- `frontend` — Frontend/Angular changes
- `docker` — Docker/infrastructure changes
- `ci` — GitHub Actions/CI-CD
- `docs` — Documentation

### Subject

- Imperative mood ("add" not "added")
- First letter lowercase
- No period at end
- Max 50 characters

### Body (Optional)

- Wrap at 72 characters
- Explain what and why, not how
- Use bullet points for multiple changes

### Footer (Optional)

Reference issues:
```
Fixes #123
Related to #456
```

Include GitHub Copilot Co-authored-by trailer:
```
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

### Examples

```
✅ Good:
feat(backend): Add build status webhook endpoint

Adds new HTTP endpoint for webhook notifications when build status changes.
Improves notification latency for manufacturing workflow updates.

Fixes #234
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>

✅ Good:
fix(frontend): Correct build list sort order

- Sort by created_at descending by default
- Maintain sort preference in session storage

Fixes #199

❌ Bad:
Added new feature
Update code
Fixed stuff
```

---

## Security

### Secrets & Credentials

**NEVER commit:**
- Database passwords
- API keys or tokens
- Private encryption keys
- AWS/cloud credentials
- Third-party service secrets

**Always use:**
- `.env.local` files (git-ignored)
- `.env.local.example` as documentation
- GitHub repository secrets (for CI/CD)
- Environment variables (in deployment)

### Secret Scanning

Before pushing, verify:
```bash
# No passwords in code
git diff --cached | grep -i "password\|secret\|key\|token"

# No .env files
git diff --cached | grep -E "\.env\."
```

### Code Security

- Use parameterized queries (prevent SQL injection)
- Validate all user input
- Don't log sensitive data
- Use HTTPS for external APIs
- Follow OWASP guidelines

See [SECURITY.md](SECURITY.md) for detailed security policies.

---

## Pull Request Process

### Before Creating PR

1. **Update main branch**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Rebase your branch**
   ```bash
   git checkout feat/your-feature
   git rebase main
   ```

3. **Run tests locally**
   ```bash
   pnpm test
   pnpm lint
   ```

4. **Push to remote**
   ```bash
   git push origin feat/your-feature
   ```

### Creating PR

Use GitHub CLI or GitHub UI:

```bash
gh pr create \
  --title "feat: Add new build monitoring feature" \
  --body "## Changes

- Add new build monitoring dashboard
- Add real-time metrics display
- Add webhook notifications

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete

Fixes #234"
```

### PR Title Format

```
<type>(<scope>): <description>
```

Examples:
- `feat(backend): Add build status API endpoint`
- `fix(frontend): Correct build list filtering`
- `docs: Update deployment documentation`

### PR Description

Include:
- **What changes were made** (summary)
- **Why changes were made** (motivation)
- **How to test** (steps for reviewer)
- **Related issues** (Fixes #123)
- **Testing checklist** (what was tested)

---

## Code Review

### Solo Developer Workflow

1. **PR auto-approved** by AI Code Review workflow
   - Confirms PR from solo developer (@pluto-atom-4)
   - Confirms not a draft PR
   - Creates automatic approval review

2. **CI checks run** automatically
   - All tests must pass
   - Linting must pass
   - Build must succeed
   - Code scanning (CodeQL) must pass

3. **Manual review** (recommended for complex changes)
   - Review own code before merge
   - Check for logic errors
   - Verify security practices

4. **Manual merge** via GitHub UI
   - Merge strategy: Squash (recommended) or Merge
   - Delete head branch after merge

### Review Checklist

Before merging, verify:

- [ ] Tests pass (no CI failures)
- [ ] No hardcoded secrets or credentials
- [ ] No debug logging left in code
- [ ] Code follows standards (style, naming)
- [ ] Documentation updated if needed
- [ ] Changes are atomic (single purpose)

### Skip Auto-Approval (Not Implemented)

Currently, all PRs from solo developer auto-approve. To skip:

- Create PR in draft mode
- Request manual review via GitHub UI
- Manual merge when ready

---

## Branching Strategy

### Main Branch (`main`)

- Always deployable
- Protected branch (no direct pushes)
- Requires PR + approval + CI passing
- Always represents production-ready code

### Feature Branches

- One feature per branch
- Descriptive names (see naming convention)
- Rebase before PR
- Delete after merge

### Release Process

1. Create release branch from main
2. Update version numbers
3. Update CHANGELOG
4. Create PR with release notes
5. Merge and tag as release

---

## Documentation

### Code Documentation

- Write clear, descriptive comments for complex logic
- Use XML documentation on public C# methods
- Use TSDoc/JSDoc on public TypeScript functions
- Document assumptions and constraints

**Example (C#):**
```csharp
/// <summary>
/// Creates a new build and initializes its workflow state.
/// </summary>
/// <param name="request">Build creation request with name and configuration</param>
/// <returns>Newly created Build with initialized state</returns>
/// <exception cref="ArgumentNullException">Thrown when request is null</exception>
/// <exception cref="InvalidOperationException">Thrown when configuration is invalid</exception>
public async Task<Build> CreateBuildAsync(CreateBuildRequest request)
```

### README Updates

Update [README.md](README.md) if:
- Adding new features
- Changing setup process
- Adding new dependencies
- Changing API contracts

### API Documentation

GraphQL schema is auto-generated. Update:
- Backend entity descriptions (C# XML docs)
- Resolver documentation
- Query/mutation descriptions

---

## Performance Considerations

### Backend

- Use `QueryTrackingBehavior.NoTracking` for dashboard reads
- Implement DataLoaders for N+1 prevention
- Use Dapper for high-velocity telemetry writes
- Profile database queries with SQL Server tools

### Frontend

- Use `ChangeDetectionStrategy.OnPush` on all components
- Implement `trackBy` functions on all `*ngFor` loops
- Use `OnPush` with proper immutability patterns
- Lazy-load routes and features

---

## Common Issues & Troubleshooting

### Setup Issues

See [docs/SETUP.md](docs/SETUP.md) troubleshooting section.

### Test Failures

```bash
# Clear node_modules and pnpm cache, then reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild backend
cd backend/src
dotnet clean
dotnet build

# Run tests again
pnpm test
```

### Git Issues

```bash
# Rebase conflicts
git rebase --abort          # Restart rebase
git rebase main             # Try again after resolving

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

---

## Copilot & AI Code Generation

For GitHub Copilot CLI and AI-assisted code generation:
- See [.github/copilot-instructions.md](.github/copilot-instructions.md) for setup and usage
- Review AI-generated code before committing
- Ensure AI output follows code standards (above)
- Test AI-generated code thoroughly

---

## Questions?

- Check [docs/SETUP.md](docs/SETUP.md) for setup help
- Review [SECURITY.md](SECURITY.md) for security questions
- See [CLAUDE.md](CLAUDE.md) for architecture details
- Check [.github/copilot-instructions.md](.github/copilot-instructions.md) for Copilot usage
- Open GitHub Issues for bugs or feature requests

---

## Resources

- [Angular Best Practices](https://angular.io/guide/styleguide)
- [C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [.github/copilot-instructions.md](.github/copilot-instructions.md) — Copilot CLI setup and usage

---

**Last Updated:** 2026-05-20  
**Status:** Active  
**Owner:** @pluto-atom-4
