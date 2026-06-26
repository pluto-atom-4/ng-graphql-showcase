# Test Configuration Setup

## Local Development Setup

### Option 1: Environment Variables (Recommended)

Docker-compose automatically sets `MSSQL_SA_PASSWORD` when running `pnpm docker:up`. The test fixture reads this environment variable.

```bash
pnpm docker:up
dotnet test FactoryApp.Tests/
```

No additional configuration needed.

### Option 2: appsettings.Development.json

For advanced local configuration, copy the template and replace credentials:

```bash
cp appsettings.Development.example.json appsettings.Development.json
```

Edit `appsettings.Development.json` and replace `[PUT_PASSWORD_HERE]` with the SA password from docker-compose.yml:

```json
"DefaultConnection": "Server=localhost,1433;Database=FactoryDb;User Id=sa;Password=P@ssw0rd1234!;TrustServerCertificate=True"
```

Then run tests:

```bash
dotnet test FactoryApp.Tests/
```

**Important:** `appsettings.Development.json` is in `.gitignore` and must never be committed with real credentials.

## Test Infrastructure

### Credential Resolution Order

1. **appsettings.Development.json** (if exists in test directory)
2. **MSSQL_SA_PASSWORD** environment variable
3. **Hardcoded default** `P@ssw0rd1234!`

### Database Lifecycle

Each test gets an isolated database: `FactoryAppDb_Test_{GUID}`

- Created on test init
- Seeded with fixtures
- Destroyed on test cleanup

No test database bloat or interference.

## CI/CD Integration

Set `MSSQL_SA_PASSWORD` environment variable in your CI system (GitHub Actions, Azure DevOps, etc).

Test fixture automatically uses it without code changes.
