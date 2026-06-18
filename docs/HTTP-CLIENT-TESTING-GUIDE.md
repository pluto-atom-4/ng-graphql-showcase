# HTTP Client Testing Guide

Complete guide to testing the Factory App GraphQL API using the REST Client extension (VS Code) and 8 comprehensive HTTP request files.

---

## 1. Setup & Prerequisites

### Required Tools

- **VS Code** (any recent version)
- **REST Client Extension** — Install from VS Code extensions marketplace
  - ID: `humao.rest-client`
  - Free, open-source HTTP client for VS Code

### System Requirements

- **Backend running on port 5000**
  - Start with: `pnpm dev:backend` (or `cd backend && dotnet watch run`)
  - Verify: Open http://localhost:5000/graphql in browser (should show GraphQL Playground if enabled)

- **SQL Server running** (via Docker)
  - Start with: `pnpm docker:up`
  - Verify: `docker ps` should show `ng-graphql-sql-server` container

### Getting Started

1. Install REST Client extension in VS Code
2. Clone/open the repository in VS Code
3. Navigate to `backend/src/FactoryApp.WebApi/` directory
4. Open any `.http` file — REST Client shows "Send Request" button above each request
5. Click "Send Request" to execute GraphQL query/mutation

---

## 2. Basics: Sending Your First Request

### HTTP File Anatomy

```http
@import http-client.env.json

POST {{graphqlUrl}}
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "query": "query { build(id: \"123\") { id name } }"
}
```

**Components:**

- `@import http-client.env.json` — Import shared variables (baseUrl, graphqlUrl)
- `POST` — HTTP method (all GraphQL requests use POST)
- `{{graphqlUrl}}` — Variable reference (defined in http-client.env.json)
- `Content-Type: application/json` — Required header for JSON body
- `Authorization: Bearer {{token}}` — JWT token for authenticated requests (optional for login)
- Request body — GraphQL query/mutation in JSON format

### GraphQL Request Structure

All requests follow this pattern:

```json
{
  "query": "mutation { createBuild(name: \"...\") { id name } }"
}
```

Or with variables (advanced):

```json
{
  "query": "mutation CreateBuild($name: String!) { createBuild(name: $name) { id } }",
  "variables": { "name": "Build Name" }
}
```

### Reading Response

Success response:

```json
{
  "data": {
    "createBuild": {
      "id": "a1b2c3d4-...",
      "name": "Build Name"
    }
  }
}
```

Error response:

```json
{
  "errors": [
    {
      "message": "Build name cannot be empty",
      "extensions": {
        "code": "VALIDATION_ERROR"
      }
    }
  ]
}
```

**Key:** GraphQL returns HTTP 200 even on errors. Check `errors` field to detect failures.

---

## 3. Authentication & Token Management

### Login Flow

1. Open `01-authentication.http`
2. Execute the first request: "Login with valid credentials"
   - Email: `test@example.com`
   - Password: `SecurePassword123!`
3. Copy JWT token from response `data.login.token`

### Using Token in Subsequent Requests

Each `.http` file includes a variable at the top:

```http
@token = paste_token_from_01_authentication_here
```

**Two ways to populate:**

**Option A: Manual (easiest for testing)**

1. Run login request in `01-authentication.http`
2. Copy the token value from response
3. Replace `@token = paste_token_from_01_authentication_here` with `@token = eyJhbGc...` (paste full token)
4. Save file — other requests now use the real token

**Option B: Automatic (REST Client feature)**
REST Client can extract values from responses. Add this comment after login request:

```http
# @token = response.body.data.login.token
```

(Feature depends on REST Client version; manual copy/paste is more reliable)

### Token Expiration

- Default expiration: 1 hour
- Check `Jwt:ExpirationHours` in CLAUDE.md (set to 1)
- If requests return `"Unauthorized"`, re-run login request to get fresh token

---

## 4. Common Workflows

### Full CRUD Workflow

**Goal:** Create a build, add parts, update status, submit test run.

**Steps:**

1. **01-authentication.http** → Run login, extract token
2. **02-create-build.http** → Run "Create build with valid name", copy `id` from response
3. **06-add-part.http** → Run "Add part with valid inputs" (use copied build ID)
4. **05-update-build-status.http** → Run "Update status PENDING → RUNNING"
5. **07-submit-test-run.http** → Run "Submit test run with PASSED status"
6. **04-query-build-with-relations.http** → Run "Query build with both parts and testRuns"

**Result:** Full lifecycle from creation → test completion, with parts and test runs associated.

### Testing Error Scenarios

1. Open `02-create-build.http`
2. Run "Create build with empty name" → Verify error response format
3. Open `03-query-builds.http`
4. Run "Query builds with invalid limit (-1)" → Verify validation error
5. Open `08-error-cases.http`
6. Run all requests to see different error types

**Expected:** All return HTTP 200 with `errors` array (not HTTP 400/500)

### Batch Queries (DataLoader Efficiency)

1. Create multiple builds (repeat 02-create-build.http 3+ times)
2. Open `04-query-build-with-relations.http`
3. Run "Query multiple builds to test DataLoader batching"
4. Check backend logs (console output during `dotnet watch run`):
   - Should see: 1 query for builds + 1 batch query for parts (not N queries)

### Mutation with Event Emission

1. Open `05-update-build-status.http`
2. Run "Update status PENDING → RUNNING"
3. Check backend logs — should see WebSocket event emission
4. (Advanced) Open second terminal with `graphql-ws` client to see real-time event

---

## 5. Response Interpretation

### Success Response Format

```json
{
  "data": {
    "build": {
      "id": "...",
      "name": "...",
      "status": "PENDING"
    }
  }
}
```

**Markers:**

- `"data"` key present
- `"errors"` key absent or empty
- Requested fields populated

### Error Response Format

```json
{
  "errors": [
    {
      "message": "Build name cannot be empty",
      "extensions": {
        "code": "VALIDATION_ERROR"
      }
    }
  ],
  "data": null
}
```

**Markers:**

- `"errors"` array with 1+ objects
- `"message"` field describes problem
- `"extensions.code"` categorizes error (VALIDATION_ERROR, NOT_FOUND, etc.)
- `"data"` is null (no partial data on error)

### HTTP Status vs GraphQL Status

| HTTP Status | GraphQL Status         | Meaning                                       |
| ----------- | ---------------------- | --------------------------------------------- |
| 200         | `data` + no `errors`   | ✅ Success                                    |
| 200         | `errors` array present | ✅ GraphQL validation error (check `message`) |
| 400         | (malformed JSON)       | ❌ Client error (invalid HTTP request)        |
| 500         | (backend crash)        | ❌ Server error (check backend logs)          |

**Rule:** Always check `errors` field first, regardless of HTTP status.

### Extensions Field

`extensions` contains metadata:

```json
{
  "data": { ... },
  "extensions": {
    "duration": 12,
    "code": "VALIDATION_ERROR"
  }
}
```

- `duration` — Query execution time in milliseconds
- `code` — Error category (VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED)

Use `duration` to compare performance (see Section 6 for profiling).

---

## 6. Performance Tuning & Profiling

### DataLoader Verification (No N+1 Queries)

**Test Goal:** Confirm parts are batch-loaded, not loaded 1-per-build.

**Steps:**

1. Open `02-create-build.http`, create 3 builds
2. For each build, run `06-add-part.http` twice (add 2 parts per build)
3. Open `04-query-build-with-relations.http`
4. Run "Query multiple builds to test DataLoader batching"
5. Check backend console during request:

**Correct output (with DataLoader):**

```
info: Executing query...
info: Build query executed (1 database call)
info: Parts batch loader executed (1 database call)
info: Total: 2 database calls for 3 builds with 6 parts
```

**Incorrect output (N+1 problem, if unfixed):**

```
info: Build query executed (1 database call)
info: Loading parts for build 1 (1 database call)
info: Loading parts for build 2 (1 database call)
info: Loading parts for build 3 (1 database call)
info: Total: 4 database calls (1 + N)
```

**If you see N+1:** Verify BuildType.cs has DataLoader configured for parts.

### NoTracking Optimization Baseline

**Test Goal:** Measure query response time with/without EF Core tracking.

**Steps:**

1. Open `03-query-builds.http`
2. Run "Query paginated builds - first page"
3. Check response `extensions.duration` (e.g., 25ms)
4. Run "Query paginated builds - first page" 5 more times, note average
5. This is your baseline (queries use NoTracking for performance)

**Expected:** Queries return in 20-50ms (depending on database size)

### Pagination Best Practices

- **Max limit:** 1000 items per page (enforced in code)
- **Recommended:** 10-100 items per page for UI
- **Test:** Run `03-query-builds.http` with limit=1, 10, 100, 1000
- **Measure:** Notice response time increases with limit (more data to serialize)

### Connection Metrics

Check backend console during requests:

```
info: Executing query: SELECT ... FROM Builds WHERE ... (Duration: 8ms)
info: Loading related data via DataLoader (Duration: 4ms)
info: Total query time: 12ms
```

Compare slow queries (>100ms) against code to find bottlenecks.

---

## 7. Advanced Scenarios

### Subscriptions (Real-Time Updates)

**Limitation:** REST Client extension doesn't natively support WebSocket subscriptions.

**Workaround:** Use `graphql-ws` CLI tool to test subscriptions:

```bash
npm install -g graphql-ws
graphql-ws -u ws://localhost:5000/graphql
```

Then subscribe:

```graphql
subscription {
  buildStatus(buildId: "...") {
    buildId
    status
    timestamp
  }
}
```

**Note:** Backend must emit WebSocket events via `ITopicEventSender` (configured in Mutations).

### Concurrent Mutations (Transaction Isolation)

**Test Goal:** Verify concurrent operations don't interfere.

**Steps:**

1. Create 2 builds
2. Open `05-update-build-status.http` in two editor tabs
3. Change buildId in each tab to different build
4. Execute both "Update status PENDING → RUNNING" simultaneously
5. Both should succeed independently

**Expected:** Both mutations complete without deadlock.

### Large Payloads

**Test Goal:** Verify parsing of large result/fileUrl fields.

**Steps:**

1. Open `07-submit-test-run.http`
2. Run "Submit test run with large result payload" (includes detailed test output)
3. Verify response completes successfully

**Expected:** Large payloads (1MB+) should parse without timeout.

### Multi-Stage Workflows

**Test Goal:** Execute entire feature workflow programmatically.

**Pseudocode:**

1. Login → get token
2. Create build → get buildId
3. Loop 5 times: Add part to build
4. Update status PENDING → RUNNING
5. Loop 3 times: Submit test run (status varies: RUNNING, PASSED, FAILED)
6. Query final build state with all relations

**Expected:** All steps complete atomically; final query shows all parts and test runs.

---

## 8. Troubleshooting & Common Issues

### "Unknown variable: buildId"

**Cause:** Forgot to create a build first, or `@buildId` variable not set.

**Fix:**

1. Run `02-create-build.http` → "Create build with valid name"
2. Copy `id` from response
3. At top of `.http` file, change `@buildId = paste_build_id...` to actual ID
4. Save file and retry

### "Unauthorized" Response

**Cause:** JWT token missing or expired (default: 1-hour window).

**Fix:**

1. Run `01-authentication.http` → "Login with valid credentials"
2. Copy new token from `data.login.token`
3. Update `@token` variable in affected `.http` file
4. Retry request

### "Internal Server Error" or Backend Crash

**Cause:** Unhandled exception in C# code.

**Fix:**

1. Check backend console (window running `pnpm dev:backend`)
2. Look for stack trace and exception message
3. Common causes:
   - Null reference exception (accessing deleted entity)
   - Database connection lost (SQL Server not running)
   - Validation error not caught (add try-catch)

**Action:** Fix C# code, save (hot reload should apply), retry request.

### "Port 5000 Refused" Connection Error

**Cause:** Backend not running.

**Fix:**

1. Terminal 1: `cd backend && dotnet watch run` (or `pnpm dev:backend`)
2. Wait 10-15 seconds for startup
3. Verify: `curl http://localhost:5000/health` (or open GraphQL Playground)
4. Retry HTTP request

### "Invalid JSON" in Request Body

**Cause:** Missing quotes, unescaped characters, or malformed GraphQL query.

**Fix:**

1. Check for mismatched braces `{}`
2. Verify strings wrapped in double quotes `""`
3. Escape quotes in queries: `\"` for literal quote inside string
4. Use REST Client inline JSON syntax highlight (SHIFT+ALT+F to format)

### "No Response" or Timeout

**Cause:** Long-running query, database deadlock, or infinite loop.

**Fix:**

1. Check backend logs for warnings
2. Simplify query (reduce limit or remove nested relations)
3. Check SQL Server status: `docker logs ng-graphql-sql-server`
4. If deadlock: Verify EF Core + Dapper share same DbTransaction (see CLAUDE.md)

### "CORS Error" (if frontend accessing API)

**Not applicable for HTTP Client testing** — REST Client is local tool without browser CORS restrictions.

**But:** If testing from frontend browser code, ensure backend has CORS configured (it should be in Program.cs).

### "Query depth exceeds limit"

**Cause:** Nested query too deep (max 5 levels per CLAUDE.md).

**Fix:**

1. Reduce nesting: split multi-level query into separate queries
2. Example: Instead of build → parts → subcomponent → subcomponent → subcomponent
3. Use: build query, then separate parts query

---

## Quick Reference

### File Organization

| File                                 | Purpose          | Key Requests                                       |
| ------------------------------------ | ---------------- | -------------------------------------------------- |
| `01-authentication.http`             | Login & token    | Valid login, invalid credentials, error cases      |
| `02-create-build.http`               | Create builds    | Valid input, validation errors (name, description) |
| `03-query-builds.http`               | Query paginated  | Pagination, cursor logic, validation               |
| `04-query-build-with-relations.http` | DataLoader test  | Parts/testRuns, batch loading, N+1 verification    |
| `05-update-build-status.http`        | Status mutations | State transitions, invalid IDs, event emission     |
| `06-add-part.http`                   | Part CRUD        | Valid parts, validation (quantity, SKU)            |
| `07-submit-test-run.http`            | Test runs        | PASSED/FAILED/RUNNING, transaction atomicity       |
| `08-error-cases.http`                | Error handling   | Malformed queries, missing fields, invalid enums   |

### Useful Variables

| Variable     | Value                           | Used In                    |
| ------------ | ------------------------------- | -------------------------- |
| `baseUrl`    | `http://localhost:5000`         | All files                  |
| `graphqlUrl` | `http://localhost:5000/graphql` | All files                  |
| `token`      | JWT from login                  | All authenticated requests |
| `buildId`    | UUID from create build          | Parts, updates, test runs  |

### Response Status Codes

| Code           | Meaning              | Example                          |
| -------------- | -------------------- | -------------------------------- |
| 200 + `data`   | ✅ Success           | `{ "data": { "build": {...} } }` |
| 200 + `errors` | ⚠️ Validation error  | `{ "errors": [{...}] }`          |
| 400            | ❌ Malformed request | Invalid JSON, bad syntax         |
| 401            | ❌ Unauthorized      | Missing/expired token            |
| 500            | ❌ Server error      | Backend crash                    |

---

## Additional Resources

- **GraphQL Schema:** `backend/src/FactoryApp.WebApi/schema.graphql` — Complete type definitions
- **Frontend Operations:** `frontend/src/app/graphql/build.graphql` — Example queries/mutations
- **Architecture Guide:** `docs/ARCHITECTURE.md` — System design, DataLoaders, type-safety
- **Resolver Code:** `backend/src/FactoryApp.GraphQL/` — Mutation/query implementations

---

**Last Updated:** 2026-06-17
