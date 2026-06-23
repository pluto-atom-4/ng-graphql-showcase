# HTTP Client Testing

JetBrains HTTP Client test suite for Factory App GraphQL API.

## Quick Start

### IDE (Rider/WebStorm)

1. Open `01-authentication.http`
2. Click green **Run** button in gutter
3. View response in right panel
4. Subsequent requests reuse token via `{{token}}` variable

### CLI (ijhttp)

```bash
cd backend/src/FactoryApp.WebApi/http-tests
ijhttp 01-authentication.http --env dev
ijhttp 02-create-build.http --env dev
```

## Files

| File                                 | Purpose                              |
| ------------------------------------ | ------------------------------------ |
| `01-authentication.http`             | Login, token extraction              |
| `02-create-build.http`               | Build CRUD, validation               |
| `03-query-builds.http`               | Pagination, filtering                |
| `04-query-build-with-relations.http` | DataLoader, N+1 prevention           |
| `05-update-build-status.http`        | Status transitions                   |
| `06-add-part.http`                   | Part management                      |
| `07-submit-test-run.http`            | Test runs, transactions              |
| `08-error-cases.http`                | Error handling                       |
| `helpers.js`                         | Reusable helper functions            |
| `http-client.env.json`               | Shared environment config (dev/prod) |
| `http-client.private.env.json`       | Sensitive tokens (gitignored)        |

## Helper Functions

Import in response handlers:

```http
> {%
  import { tokenManager, errorValidator, queryCounter, perfTracker, schemaValidator } from "./helpers.js";

  // Save token
  tokenManager.saveToken("dev", response.body.data.login.token);

  // Validate errors
  errorValidator.assertNoErrors(response);
  errorValidator.assertValidationError(response, "email");

  // Check DataLoader batching
  queryCounter.assertBatchLoading(10, 2); // 10 items, 2 queries expected

  // Performance
  perfTracker.assertUnder(100, "Query too slow");

  // Schema validation
  schemaValidator.assertFieldType(response, "data.build.id", "string");
  schemaValidator.assertUUID(response, "data.build.id");
%}
```

## Test Fixtures

Pre-seeded test data available via **FixtureSeeder.cs**:

- 3 users (test@, admin@, user@example.com) with password `SecurePassword123!`
- 10 builds (PENDING, RUNNING, COMPLETE, FAILED, edge cases)
- 10 parts under "DataLoader Test Build" for N+1 verification
- 4 test runs (PASSED, FAILED, RUNNING)

Fixed GUIDs for reproducible sequences:

```
Builds:     10000000-0000-0000-0000-0000000000XX
Users:      00000000-0000-0000-0000-0000000000XX
Parts:      20000000-0000-0000-0000-0000000000XX
TestRuns:   30000000-0000-0000-0000-0000000000XX
```

See `docs/FIXTURES.md` for complete fixture reference.

## Common Workflows

### Login → Create → Query

```
01-authentication.http
  (saves token to client.global)
    ↓
02-create-build.http
  (uses {{token}}, saves {{buildId}})
    ↓
03-query-builds.http or 04-query-build-with-relations.http
  (uses {{token}} + {{buildId}})
```

### DataLoader Verification

1. Run 02-create-build.http 3+ times to create multiple builds
2. Run 04-query-build-with-relations.http → "Query multiple builds"
3. Check backend logs: should see 1 build query + 1 batch parts query (not N queries)

### Error Scenario Testing

```
08-error-cases.http
  → Run each request
  → Verify GraphQL errors in response (HTTP 200 with errors field)
  → Use errorValidator.assertValidationError(response)
```

## Environment Variables

**http-client.env.json:**

```json
{
  "dev": {
    "baseUrl": "http://localhost:5275",
    "graphqlUrl": "http://localhost:5275/graphql",
    "token": ""
  },
  "production": {
    "baseUrl": "https://api.example.com",
    "graphqlUrl": "https://api.example.com/graphql",
    "token": ""
  }
}
```

**http-client.private.env.json** (gitignored):

```json
{
  "dev": {
    "token": "eyJhbGc..."
  }
}
```

## Integration with Development

In `Program.cs`:

```csharp
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<FactoryDbContext>();
        await FixtureSeeder.SeedAllAsync(dbContext);
    }
}
```

Start backend:

```bash
pnpm dev:backend
```

Database auto-populates with fixtures. All test files use fixed GUIDs, enabling consistent test runs.

## Troubleshooting

### "Unknown variable: token"

Token not saved. Run 01-authentication.http first to populate {{token}}.

### "Unauthorized" response

Token expired (1-hour default). Re-run 01-authentication.http.

### "Port 5275 refused"

Backend not running. Start with `pnpm dev:backend`.

### "Build not found"

Fixture not seeded. Verify FixtureSeeder.SeedAllAsync() called in Program.cs.

## Related Documentation

- **HTTP Client Testing Guide:** `docs/HTTP-CLIENT-TESTING-GUIDE.md`
- **Test Fixtures Reference:** `docs/FIXTURES.md`
- **Architecture & DataLoaders:** `docs/ARCHITECTURE.md`
- **JetBrains HTTP Client Docs:** https://www.jetbrains.com/help/webstorm/http-client-in-product-code-editor.html

---

**Status:** Phase 1 + Phase 2 Complete | **Last Updated:** 2026-06-22
