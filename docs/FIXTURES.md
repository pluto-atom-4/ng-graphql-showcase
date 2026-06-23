# Test Fixtures Guide

Complete guide to test data setup for HTTP Client testing.

---

## Overview

Test fixtures provide deterministic, reusable test data for API testing. Three mechanisms available:

1. **C# Programmatic Seeding** (Recommended for development)
2. **SQL Script** (For CI/CD pipelines)
3. **JSON Configuration** (Fixture specifications)

---

## Quick Start

### Development (C# Seeding)

In `Program.cs`:

```csharp
if (app.Environment.IsDevelopment())
{
    await FixtureSeeder.SeedAllAsync(dbContext);
}
```

Then start backend:

```bash
pnpm dev:backend
```

Database auto-populates with test fixtures on startup.

### CI/CD (SQL Script)

After migrations, run:

```bash
sqlcmd -S localhost -U sa -P <password> -d FactoryApp -i seed-test-data.sql
```

---

## Test Data Overview

### Test Users (3)

| Email             | Password           | Purpose                   |
| ----------------- | ------------------ | ------------------------- |
| test@example.com  | SecurePassword123! | Standard login/auth tests |
| admin@example.com | AdminPassword123!  | Multi-user scenarios      |
| user@example.com  | UserPassword123!   | Permission testing        |

All users share same bcrypt hash for simplicity in development.

### Test Builds (10)

| Build Name              | Status   | Purpose                                 |
| ----------------------- | -------- | --------------------------------------- |
| Q2 2026 Production Run  | PENDING  | Happy path creation + query tests       |
| Legacy System Migration | RUNNING  | Status transition testing               |
| Testing Phase Build     | RUNNING  | Concurrent mutation scenarios           |
| Completed Build A       | COMPLETE | Read-heavy test queries                 |
| Failed Build B          | FAILED   | Error scenario handling                 |
| DataLoader Test Build   | PENDING  | N+1 query prevention verification       |
| Pagination Test Build   | PENDING  | Pagination limit/offset boundary tests  |
| Transaction Test Build  | PENDING  | EF Core + Dapper transaction atomicity  |
| Edge Case Build 1       | PENDING  | Max-length description (1000 chars)     |
| Edge Case Build 2       | PENDING  | Empty/null description (optional field) |

**Fixed GUIDs:** Consistent across runs (reproducible test sequences)

```
pending-01:       10000000-0000-0000-0000-000000000001
running-01:       10000000-0000-0000-0000-000000000002
running-02:       10000000-0000-0000-0000-000000000003
complete-01:      10000000-0000-0000-0000-000000000004
failed-01:        10000000-0000-0000-0000-000000000005
dataloader-test:  10000000-0000-0000-0000-000000000006
pagination-test:  10000000-0000-0000-0000-000000000007
transaction-test: 10000000-0000-0000-0000-000000000008
edge-case-01:     10000000-0000-0000-0000-000000000009
edge-case-02:     10000000-0000-0000-0000-000000000010
```

### Test Parts (10)

Seeded under `DataLoader Test Build` (ID: 10000000-0000-0000-0000-000000000006).

| Part Name           | SKU           | Quantity | Purpose                |
| ------------------- | ------------- | -------- | ---------------------- |
| Precision Bearing   | SKU-PB-001    | 5        | Standard part          |
| Control Module      | SKU-CM-042    | 2        | Standard part          |
| Power Supply Unit   | SKU-PSU-003   | 1        | Min quantity edge case |
| Connector Assembly  | SKU-CA-015    | 8        | Mid-range quantity     |
| Sensor Module       | SKU-SM-007    | 3        | Standard part          |
| Communication Board | SKU-CB-021    | 1        | Min quantity edge case |
| Thermal Interface   | SKU-TI-009    | 4        | Standard part          |
| Mounting Hardware   | SKU-MH-012    | 50       | Max quantity edge case |
| Cable Assembly A    | SKU-CAB-A-001 | 2        | SKU pattern test       |
| Cable Assembly B    | SKU-CAB-B-002 | 3        | SKU pattern test       |

**Purpose:** Verify DataLoader batch-loads all 10 parts without N+1 queries.

### Test Runs (4)

| Build | Status  | Result                               | Purpose                          |
| ----- | ------- | ------------------------------------ | -------------------------------- |
| 004   | PASSED  | "All assertions passed - 150/150..." | Happy path result storage        |
| 004   | PASSED  | "Regression tests passed..."         | Multiple runs per build          |
| 005   | FAILED  | "Assertion failed at line 42..."     | Error result capture             |
| 005   | RUNNING | null                                 | In-progress status (null result) |

---

## Fixture Files

### `backend/src/FactoryApp.WebApi/test-fixtures.json`

**Purpose:** Configuration specs for test data (constraints, boundaries, transitions).

**Contains:**

- Test user credentials
- Predefined build IDs & descriptions
- Part SKU patterns & quantity ranges
- Pagination test sizes (1, 5, 10, 50, 100, 1000)
- Build status transitions (state machine edges)
- Field constraints (min/max lengths, values)

**Usage:** Reference during test design to understand coverage.

### `backend/src/FactoryApp.WebApi/seed-test-data.sql`

**Purpose:** Idempotent SQL for database population (CI/CD, manual seeding).

**Features:**

- Checks existence before insert (idempotent)
- Uses bcrypt password hashes
- Sets fixed GUIDs for reproducibility
- Includes status summaries

**Usage:**

```bash
# macOS/Linux
sqlcmd -S localhost -U sa -P YourPassword123! -d FactoryApp -i seed-test-data.sql

# Windows
sqlcmd -S localhost -U sa -P YourPassword123! -d FactoryApp -i seed-test-data.sql
```

### `backend/src/FactoryApp.Domain/TestFixtures/FixtureSeeder.cs`

**Purpose:** Programmatic seeding via C# (development-friendly).

**Methods:**

```csharp
// Seed all at once
await FixtureSeeder.SeedAllAsync(dbContext);

// Seed individual components
await FixtureSeeder.SeedTestUsersAsync(dbContext, hashedPassword);
await FixtureSeeder.SeedTestBuildsAsync(dbContext);
await FixtureSeeder.SeedTestPartsAsync(dbContext);
await FixtureSeeder.SeedTestRunsAsync(dbContext);

// Clean up (for reset)
await FixtureSeeder.CleanupAllAsync(dbContext);
```

**Integration in Program.cs:**

```csharp
using FactoryApp.Domain.TestFixtures;

// ... build configuration ...

// Seed test fixtures in development
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<FactoryDbContext>();
        await FixtureSeeder.SeedAllAsync(dbContext);
    }
}

app.Run();
```

---

## Usage Patterns

### Pattern 1: Login → Query

```http
### 01-authentication.http (after seeding)
POST {{graphqlUrl}}
{
  "query": "mutation { login(email: \"test@example.com\", password: \"SecurePassword123!\") { token user { id email } } }"
}

> {%
  client.global.set("token", response.body.data.login.token);
%}
```

Login succeeds because `test@example.com` user pre-seeded.

### Pattern 2: DataLoader N+1 Test

```http
### 04-query-build-with-relations.http
POST {{graphqlUrl}}
Authorization: Bearer {{token}}

{
  "query": "query {
    build(id: \"10000000-0000-0000-0000-000000000006\") {
      id
      parts { id name sku quantity }
    }
  }"
}

> {%
  client.test("10 parts loaded", function() {
    client.assert(response.body.data.build.parts.length === 10, "Expected 10 parts");
  });
%}
```

`DataLoader Test Build` has exactly 10 pre-seeded parts. Backend should issue 2 total queries (1 for build, 1 batch for parts).

### Pattern 3: Status Transition Test

```http
### 05-update-build-status.http
POST {{graphqlUrl}}
Authorization: Bearer {{token}}

{
  "query": "mutation {
    updateBuildStatus(id: \"10000000-0000-0000-0000-000000000001\", status: RUNNING) {
      id status
    }
  }"
}

> {%
  client.test("Status changed to RUNNING", function() {
    client.assert(response.body.data.updateBuildStatus.status === "RUNNING");
  });
%}
```

`Q2 2026 Production Run` starts as PENDING, transitions to RUNNING.

### Pattern 4: Pagination Test

```http
### 03-query-builds.http
POST {{graphqlUrl}}
Authorization: Bearer {{token}}

{
  "query": "query { builds(limit: 5, offset: 0) { items { id name } totalCount hasNextPage } }"
}

> {%
  client.test("Pagination works", function() {
    client.assert(response.body.data.builds.items.length <= 5);
    client.assert(response.body.data.builds.totalCount >= 10); // At least test fixtures
  });
%}
```

Test fixtures provide 10 pre-built builds for pagination verification.

---

## Fixture Lifecycle

### Development Flow

```
1. dotnet watch run (Program.cs calls FixtureSeeder.SeedAllAsync)
   ↓
2. Database populated with test fixtures
   ↓
3. Open 01-authentication.http → Run login
   ↓
4. Test token saved → Use in 02, 03, 04, etc.
   ↓
5. All .http tests reference fixture IDs (e.g., buildId=10000000-0000-0000-0000-000000000001)
   ↓
6. CI/CD runs full test suite using same fixture IDs
```

### Reset Fixtures

```csharp
// In your test setup or admin endpoint
await FixtureSeeder.CleanupAllAsync(dbContext);
await FixtureSeeder.SeedAllAsync(dbContext);
// Database reset to clean state
```

---

## Fixed GUIDs (Reproducibility)

All test fixtures use **fixed UUIDs** (not random). This ensures:

- **Reproducible test runs:** Same buildId every time
- **CI/CD automation:** Can hardcode fixture IDs in .http files
- **Parallel testing:** Different builds use non-overlapping ID ranges

```
Test User IDs:    00000000-0000-0000-0000-0000000000XX
Test Build IDs:   10000000-0000-0000-0000-0000000000XX
Test Part IDs:    20000000-0000-0000-0000-0000000000XX
Test Run IDs:     30000000-0000-0000-0000-0000000000XX
```

---

## Edge Cases Covered

| Edge Case                          | Fixture                | Testing Strategy              |
| ---------------------------------- | ---------------------- | ----------------------------- |
| Empty description (optional field) | Edge Case Build 2      | Query with null description   |
| Max-length description (1000 char) | Edge Case Build 1      | Verify parsing, no truncation |
| Min quantity (1)                   | Control Module (qty=1) | Boundary validation           |
| Max quantity (50+)                 | Mounting Hardware (50) | Boundary validation           |
| Multiple parts per build           | 10 parts in dataloader | Batch loading (DataLoader)    |
| Multiple test runs per build       | Completed Build A (2)  | Query optimization            |
| Status transitions                 | 5 builds across states | State machine coverage        |

---

## Troubleshooting

### "Build not found" Error

**Cause:** Fixture not seeded or ID mismatch.

**Fix:**

1. Verify backend started with `pnpm dev:backend`
2. Check Program.cs calls `FixtureSeeder.SeedAllAsync(dbContext)`
3. Verify fixture ID in .http file matches test-fixtures.json

### "No builds returned" in Pagination Test

**Cause:** SQL seed script ran but fixtures not inserted (permissions, connection issue).

**Fix:**

1. Verify SQL Server running: `docker ps`
2. Check SQL Server logs: `docker logs ng-graphql-sql-server`
3. Re-run manually: `sqlcmd -S localhost ...`

### Password Hash Mismatch

**Cause:** Bcrypt hash in SQL doesn't match AuthService verification.

**Fix:**

1. Use provided hash: `$2a$11$K3v5Yh.CowdS2c1P5nBQhu1Y5iBJ3dNLHKh8hZRqcmMHPVa6LWlue`
2. Or regenerate: `AuthService.HashPassword("SecurePassword123!")`
3. Update seed-test-data.sql + FixtureSeeder.cs

---

## References

- **Configuration:** `test-fixtures.json`
- **SQL Seeding:** `seed-test-data.sql`
- **C# Integration:** `TestFixtures/FixtureSeeder.cs`
- **HTTP Testing:** `docs/HTTP-CLIENT-TESTING-GUIDE.md`

---

**Last Updated:** 2026-06-22 | **Status:** Phase 1 Complete
