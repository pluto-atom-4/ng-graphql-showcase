# HTTP Client Testing Guide

Complete guide to testing the Factory App GraphQL API using **JetBrains HTTP Client** (IDE integration or CLI) and 8 comprehensive HTTP request files.

---

## 1. Setup & Prerequisites

### JetBrains IDE (Recommended for Development)

**Supported IDEs:**

- **JetBrains Rider** (C# / .NET development) — Recommended
- **WebStorm** (JavaScript/TypeScript development)
- **IntelliJ IDEA Ultimate** (Java development)

**HTTP Client is built-in** — No installation needed. Open `.http` files directly; run buttons appear in editor gutter.

### JetBrains HTTP Client CLI (For Automation/CI)

**Installation:**

**macOS (Homebrew):**

```bash
brew install --cask jetbrains-toolbox
# Then download ijhttp via Toolbox
```

**ZIP Archive (All platforms):**

```bash
# Download from https://www.jetbrains.com/help/webstorm/http-client-cli.html
# Requires JDK 21+
unzip ijhttp.zip
cd ijhttp/bin
./ijhttp myrequest.http  # macOS/Linux
ijhttp.bat myrequest.http  # Windows
```

**Docker:**

```bash
docker pull jetbrains/ijhttp
docker run --rm -v $(pwd):/home/user jetbrains/ijhttp /home/user/myrequest.http
```

### System Requirements

- **Backend running on port 5275**
  - Start with: `pnpm dev:backend` (or `cd backend && dotnet watch run`)
  - Verify: Open http://localhost:5275/graphql in browser

- **SQL Server running** (via Docker)
  - Start with: `pnpm docker:up`
  - Verify: `docker ps` shows `ng-graphql-sql-server` container

### Getting Started (IDE)

1. Open repository in Rider/WebStorm
2. Navigate to `backend/src/FactoryApp.WebApi/` directory
3. Open any `.http` file (e.g., `01-authentication.http`)
4. Click green **Run** button in editor gutter → Request executes
5. Response shows in right panel

---

## 2. Basics: Sending Your First Request

### HTTP File Anatomy (JetBrains Format)

**Environment Files:**

`http-client.env.json` — Public variables (dev, production profiles):

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

`http-client.private.env.json` — Sensitive data (token values, passwords). Automatically takes precedence over public file:

```json
{
  "dev": {
    "token": "eyJhbGc..."
  },
  "production": {
    "token": "prod-token..."
  }
}
```

To use environment, click dropdown in IDE gutter or pass `--env dev` to CLI.

\*\*Example `.http` request:

```http
@import http-client.env.json

### Section comment
POST {{graphqlUrl}}
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "query": "query { build(id: \"123\") { id name } }"
}

> {%
  client.test("Response status is 200", function() {
    client.assert(response.status === 200, "Expected 200, got " + response.status);
  });

  client.test("No GraphQL errors", function() {
    var jsonResponse = response.body;
    client.assert(!jsonResponse.errors, "Got errors: " + JSON.stringify(jsonResponse.errors));
  });
%}
```

**Components:**

- `@import http-client.env.json` — Import shared variables (baseUrl, graphqlUrl)
- `### Comment` — Section header (supported in IDE + CLI)
- `POST` — HTTP method (all GraphQL requests use POST)
- `{{graphqlUrl}}` — Variable reference (from http-client.env.json)
- Headers — `Content-Type`, `Authorization` (with Bearer token)
- Request body — GraphQL query/mutation in JSON format
- `> {% ... %}` — Response handling script (JavaScript ES6, IDE + CLI support)

### Response Validation Scripts

JetBrains HTTP Client supports **JavaScript ES6 response handlers** (both IDE and CLI):

```javascript
> {%
  client.test("Status OK", function() {
    client.assert(response.status === 200);
  });

  client.test("Has data", function() {
    var json = response.body;
    client.assert(json.data !== null);
  });

  // Save token for reuse
  client.global.set("token", response.body.data.login.token);
%}
```

Use `client.global.set(key, value)` to store response values for subsequent requests.

### GraphQL Request Structure

Standard GraphQL format:

```json
{
  "query": "mutation { createBuild(name: \"...\") { id name } }"
}
```

With variables:

```json
{
  "query": "mutation CreateBuild($name: String!) { createBuild(name: $name) { id } }",
  "variables": { "name": "Build Name" }
}
```

### Reading Response

Success:

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

Error:

```json
{
  "errors": [
    {
      "message": "Build name cannot be empty",
      "extensions": { "code": "VALIDATION_ERROR" }
    }
  ]
}
```

**Key:** GraphQL returns HTTP 200 even on errors. Always check `errors` field.

---

## 3. Authentication & Token Management

### Login Flow (JetBrains IDE)

1. Open `01-authentication.http` in Rider/WebStorm
2. Click **Run** on first request: "Login with valid credentials"
   - Email: `test@example.com`
   - Password: `SecurePassword123!`
3. Response panel shows token in `data.login.token`

### Token Reuse Across Requests

**Method 1: Automatic with Response Handler (Recommended)**

Add JavaScript handler after login request in `01-authentication.http`:

```http
> {%
  if (response.status === 200 && response.body.data && response.body.data.login.token) {
    client.global.set("token", response.body.data.login.token);
    client.log("✓ Token saved: " + response.body.data.login.token.substring(0, 20) + "...");
  }
%}
```

Then use `{{token}}` in subsequent requests:

```http
Authorization: Bearer {{token}}
```

**Method 2: Manual Variable (IDE-only)**

At top of `.http` file:

```http
@token = paste_token_from_login_response_here
```

Copy token from response and replace placeholder.

### Token Expiration

- Default: 1 hour
- Check `Jwt:ExpirationHours` in CLAUDE.md
- If "Unauthorized" error: Re-run login to get fresh token
- `client.global.set()` persists token for session (until IDE closes)

---

## 4. Common Workflows

### Full CRUD Workflow (IDE)

**Goal:** Create build → add parts → update status → submit test run → query results.

**Steps:**

1. Open `01-authentication.http` → Click Run on first request → Token saved via handler
2. Open `02-create-build.http` → Run "Create build with valid name"
   - Add response handler to save build ID:
   ```javascript
   > {%
     client.global.set("buildId", response.body.data.createBuild.id);
   %}
   ```
3. Open `06-add-part.http` → Run "Add part with valid inputs" (uses {{buildId}})
4. Open `05-update-build-status.http` → Run "Update status PENDING → RUNNING"
5. Open `07-submit-test-run.http` → Run "Submit test run with PASSED status"
6. Open `04-query-build-with-relations.http` → Run "Query build with both parts and testRuns"

**Result:** Full lifecycle from creation → completion, with all entities visible.

### Testing Error Scenarios

**IDE:**

1. Open `02-create-build.http` → Run "Create build with empty name"
2. Response panel shows GraphQL `errors` array
3. Open `08-error-cases.http` → Run all requests to see error types

**CLI:**

```bash
# Run with dev environment (default)
ijhttp 02-create-build.http --env dev
# Runs all requests, shows errors in stdout

# Run with production environment
ijhttp 02-create-build.http --env production
```

**Expected:** All return HTTP 200 with `errors` array (not HTTP 400/500).

### Batch Queries with DataLoader Verification

**IDE:**

1. Create multiple builds (run 02-create-build.http 3+ times)
2. Open `04-query-build-with-relations.http`
3. Run "Query multiple builds to test DataLoader batching"
4. Backend console (during `dotnet watch run`):
   - Should see: 1 query for builds + 1 batch query for parts (not N queries)

**CLI:**

```bash
ijhttp 04-query-build-with-relations.http --env-file http-client.env.json -L VERBOSE
# VERBOSE shows all queries in backend logs
```

### Mutation with Event Emission

1. Open `05-update-build-status.http` → Run "Update status PENDING → RUNNING"
2. Backend logs show WebSocket event: `buildStatusChanged` emitted
3. (Advanced) Use `graphql-ws` CLI to subscribe to real-time updates:
   ```bash
   graphql-ws -u ws://localhost:5275/graphql
   ```

---

## 5. Response Interpretation & Assertions

### Response Format (IDE)

**JetBrains Response Panel shows:**

- **Status** — HTTP status code (should be 200)
- **Headers** — Response headers (Content-Type, etc.)
- **Body** — JSON response (formatted)
- **Time** — Request duration (ms)

### Success Response

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

### Error Response

```json
{
  "errors": [
    {
      "message": "Build name cannot be empty",
      "extensions": { "code": "VALIDATION_ERROR" }
    }
  ],
  "data": null
}
```

### Testing with Assertions (IDE + CLI)

Add validation scripts after requests:

```javascript
> {%
  // Test HTTP status
  client.test("HTTP 200", function() {
    client.assert(response.status === 200);
  });

  // Test GraphQL errors absent
  client.test("No GraphQL errors", function() {
    client.assert(!response.body.errors, "Errors: " + JSON.stringify(response.body.errors));
  });

  // Test data present
  client.test("Data returned", function() {
    client.assert(response.body.data !== null);
  });

  // Test specific field
  client.test("Build ID exists", function() {
    client.assert(response.body.data.createBuild.id, "Missing buildId");
  });
%}
```

**CLI Test Reports:**

```bash
ijhttp 02-create-build.http --env dev --report
# Generates JUnit XML in reports/ directory
# Use in CI/CD pipelines
```

### HTTP Status vs GraphQL Status

| HTTP | GraphQL              | Meaning                     |
| ---- | -------------------- | --------------------------- |
| 200  | `data` + no `errors` | ✅ Success                  |
| 200  | `errors` array       | ✅ GraphQL validation error |
| 400  | (malformed JSON)     | ❌ Invalid request          |
| 500  | (backend crash)      | ❌ Server error             |

**Rule:** GraphQL returns HTTP 200 even on validation errors. Always check `errors` field.

---

## 6. Performance Tuning & Profiling

### DataLoader Verification (No N+1 Queries)

**IDE:**

1. Create 3 builds (run `02-create-build.http` 3 times)
2. For each build, add 2 parts (run `06-add-part.http` twice per build)
3. Open `04-query-build-with-relations.http` → Run "Query multiple builds"
4. Check backend console (terminal running `dotnet watch run`):

**Correct (with DataLoader):**

```
info: Executing query...
info: Build query executed (1 database call)
info: Parts batch loader executed (1 database call)
info: Total: 2 queries for 3 builds + 6 parts
```

**Incorrect (N+1 problem):**

```
info: Build query (1 call)
info: Loading parts for build 1 (1 call)
info: Loading parts for build 2 (1 call)
info: Loading parts for build 3 (1 call)
info: Total: 4 queries (1 + N) ❌
```

**CLI with Verbose Logging:**

```bash
ijhttp 04-query-build-with-relations.http --env dev -L VERBOSE
# -L VERBOSE shows all database queries in output
```

### Query Performance Measurement

**IDE Response Times:**

Open `03-query-builds.http` → Run same request 5 times:

| Run | Time (ms) | Status     |
| --- | --------- | ---------- |
| 1   | 45        | Cold cache |
| 2   | 12        | Warm cache |
| 3   | 11        | Warm cache |
| 4   | 13        | Warm cache |
| 5   | 12        | Warm cache |

Average warm: ~12ms (expected for 20-50 items)

**Assertions for Performance:**

```javascript
> {%
  client.test("Query time < 100ms", function() {
    var duration = parseFloat(response.responseTime) || 0;
    client.assert(duration < 100, "Slow query: " + duration + "ms");
  });
%}
```

### Pagination Best Practices

- **Max limit:** 1000 items (enforced by validation)
- **Recommended:** 10-100 items for UI
- **Test varying limits:**
  ```bash
  # Create 15 builds then run:
  ijhttp 03-query-builds.http --env limit=5 --env offset=0
  ijhttp 03-query-builds.http --env limit=10 --env offset=10
  ijhttp 03-query-builds.http --env limit=100 --env offset=0
  ```

### Backend Logging

Check database query logs:

```
info: Query: SELECT * FROM Builds... (Duration: 8ms)
info: Query: SELECT * FROM Parts... [BATCH for 3 builds] (Duration: 4ms)
info: Total: 12ms
```

Compare slow queries (>100ms) to find bottlenecks.

---

## 7. Advanced Scenarios

### Subscriptions (Real-Time Updates)

**Limitation:** JetBrains HTTP Client doesn't natively support WebSocket subscriptions in .http files.

**Workaround:** Use `graphql-ws` CLI to test subscriptions:

```bash
npm install -g graphql-ws
graphql-ws -u ws://localhost:5275/graphql
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

**Note:** Backend emits events via `ITopicEventSender` (configured in Mutations).

### Concurrent Mutations (IDE)

**Test Goal:** Verify concurrent operations don't deadlock.

**Steps (Rider/WebStorm):**

1. Create 2 builds (run `02-create-build.http` twice)
2. Open `05-update-build-status.http` in two editor tabs
3. Set different buildIds in each tab
4. Click Run on both simultaneously
5. Both should complete independently

**Expected:** No deadlock errors; both succeed.

**CLI Concurrent Test:**

```bash
# Run multiple requests in parallel
ijhttp 05-update-build-status.http --env buildId=id-1 &
ijhttp 05-update-build-status.http --env buildId=id-2 &
wait
```

### Large Payloads

**IDE:**

1. Open `07-submit-test-run.http`
2. Run "Submit test run with large result payload"
3. Response panel shows full result + fileUrl stored

**CLI:**

```bash
ijhttp 07-submit-test-run.http --env-file http-client.env.json -L VERBOSE
# Large payload logged in output
```

**Expected:** Large payloads (1MB+) parse without timeout.

### Automated Workflows (CLI)

**Run full CRUD sequence via CLI:**

```bash
# Create environment file with test data
cat > test-env.json <<EOF
{
  "baseUrl": "http://localhost:5275",
  "graphqlUrl": "http://localhost:5275/graphql",
  "token": ""
}
EOF

# Run workflow: login → create → add parts → update → test
ijhttp 01-authentication.http --env-file test-env.json
ijhttp 02-create-build.http --env-file test-env.json
ijhttp 06-add-part.http --env-file test-env.json --env iterations=2
ijhttp 05-update-build-status.http --env-file test-env.json
ijhttp 07-submit-test-run.http --env-file test-env.json

# Generate test report
ijhttp *.http --env-file test-env.json --report
# Output: JUnit XML in reports/ directory for CI/CD
```

---

## 8. Troubleshooting & Common Issues

### "Unknown variable: buildId" (IDE)

**Cause:** Variable referenced before populated or `.http` file not saved after assignment.

**Fix (Rider/WebStorm):**

1. Open `02-create-build.http` → Click Run → Copy `id` from response panel
2. Add handler to save buildId:
   ```javascript
   > {%
     client.global.set("buildId", response.body.data.createBuild.id);
   %}
   ```
3. Save file → Automatic for subsequent requests using `{{buildId}}`

**Fix (CLI):**

```bash
ijhttp 02-create-build.http --env-file http-client.env.json -V buildId=<actual-uuid>
```

### "Unauthorized" Response

**Cause:** JWT token missing, expired (1-hour default), or malformed.

**Fix (IDE):**

1. Run `01-authentication.http` → First request
2. Add response handler:
   ```javascript
   > {%
     client.global.set("token", response.body.data.login.token);
   %}
   ```
3. Reuse via `Authorization: Bearer {{token}}` in subsequent requests

**Fix (CLI):**

```bash
# Re-run login, extract token, pass to next request
TOKEN=$(ijhttp 01-authentication.http ... | jq '.data.login.token')
ijhttp 02-create-build.http --env token=$TOKEN ...
```

### "Internal Server Error" or Backend Crash

**Cause:** Unhandled exception in C# code.

**Fix:**

1. Check backend console (terminal running `pnpm dev:backend`)
2. Look for stack trace and exception message
3. Common causes:
   - Null reference exception
   - Database connection lost (SQL Server not running)
   - Validation error not caught

**Action:** Fix C# code, save (hot reload applies), retry request.

### "Connection refused: Port 5000"

**Cause:** Backend not running.

**Fix:**

1. Terminal: `pnpm dev:backend` (or `cd backend && dotnet watch run`)
2. Wait 10-15 seconds for startup
3. Verify: `curl http://localhost:5275/health`
4. Retry request

### "Unable to parse response" (CLI)

**Cause:** Invalid JSON or unexpected response format.

**Fix:**

1. Run with verbose logging:
   ```bash
   ijhttp 02-create-build.http --env-file http-client.env.json -L VERBOSE
   ```
2. Check response body in output
3. Verify GraphQL query syntax (mismatched braces, unescaped quotes)

### "No Response" or Timeout

**Cause:** Long-running query, database deadlock, or network issue.

**Fix:**

1. Check backend logs for warnings/deadlocks
2. Simplify query (reduce limit, remove relations)
3. Check SQL Server: `docker logs ng-graphql-sql-server`
4. If deadlock: Verify EF Core + Dapper share DbTransaction (CLAUDE.md)

### "Query depth exceeds limit"

**Cause:** Nested query too deep (max 5 levels per CLAUDE.md).

**Fix:**

1. Split into separate queries (e.g., fetch build, then fetch parts)
2. Example: `build { id parts { id } }` → separate parts query
3. Use DataLoaders instead of deep nesting

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

| Variable     | Dev Value                        | Production Value                                     | Scope                         |
| ------------ | -------------------------------- | ---------------------------------------------------- | ----------------------------- |
| `baseUrl`    | `http://localhost:5275`          | `https://api.example.com`                            | http-client.env.json          |
| `graphqlUrl` | `http://localhost:5275/graphql`  | `https://api.example.com/graphql`                    | http-client.env.json          |
| `token`      | JWT from login (empty initially) | Stored in http-client.private.env.json (not in repo) | Sensitive: private env        |
| `buildId`    | UUID from create build response  | UUID from create build response                      | Set via `client.global.set()` |

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
- **JetBrains HTTP Client Docs:** https://www.jetbrains.com/help/webstorm/http-client-in-product-code-editor.html
- **JetBrains HTTP Client CLI:** https://www.jetbrains.com/help/webstorm/http-client-cli.html

## IDE & CLI Comparison

| Feature             | Rider/WebStorm IDE | ijhttp CLI            |
| ------------------- | ------------------ | --------------------- |
| **Visual Editor**   | ✅ Yes             | ❌ No                 |
| **Run Button**      | ✅ Yes             | ✅ Yes (command line) |
| **Response Panel**  | ✅ Yes             | ✅ STDOUT             |
| **Variables**       | ✅ global.set/get  | ✅ --env-file, --env  |
| **Test Assertions** | ✅ Yes             | ✅ Yes                |
| **Test Reports**    | ✅ HTML/JSON       | ✅ JUnit XML          |
| **Automation**      | ⚠️ Manual          | ✅ Scripts/CI         |
| **Real-time Sync**  | ✅ Yes             | ❌ No                 |

---

**Last Updated:** 2026-06-18 | **Tools:** JetBrains Rider, WebStorm, ijhttp CLI
