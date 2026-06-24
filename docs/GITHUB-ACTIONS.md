# GitHub Actions & CI/CD

## HTTP Client Tests Workflow

### Status: Blocked (Temporary Removal)

**Branch:** `fix/github-action-http-client-test` (preserved for reference)

**Objective:** Automate HTTP Client API testing (`.http` files in `backend/src/FactoryApp.WebApi/http-tests/`) via GitHub Actions CI/CD pipeline.

**Implementation:** Created workflow `.github/workflows/http-client-tests.yml` with:

- SQL Server 2022 Express container startup
- EF Core migrations application
- Backend server launch
- ijhttp CLI invocation for REST Client test execution
- Test result parsing and GitHub Step Summary reporting

### Blocker: SQL Server Express Container Initialization

**Problem:** sa account initialization delayed 5+ minutes in GitHub Actions container environment.

**Evidence:**

- Container logs show "SQL Server is now ready for client connections" at startup
- All polling attempts fail for 5 minutes
- First successful connection at +5m9s (when xplog70.dll loads for xp_msver call)
- Pattern reproducible across multiple Action runs

**Root Causes (Investigated):**

1. ✗ Missing SQL_SA_PASSWORD secret — verified present & current
2. ✗ Connection string format — simplified from `localhost` to `.` (local pipe)
3. ✗ Health check query overhead — replaced with minimal `-i NUL` flag
4. ✗ Short initial buffer — extended from 10s → 30s, no improvement
5. ? Resource constraints — Express Edition on GitHub Actions runners may lack CPU/memory for background init

**Attempts:**

- Added 10s pre-polling buffer → no change (still 5+ min)
- Changed connection syntax (`-S localhost` → `-S .`) → no change
- Optimized health check (`-Q "SELECT 1"` → `-i NUL`) → no change
- Extended buffer to 30s + version query → no change
- Reduced polling timeout expectation → hits timeout at ~2.5min

**Why "Ready" Message is Premature:**
SQL Server signals "ready for client connections" after port binding, but sa account initialization continues in background. Express Edition appears to have longer async setup than other editions.

### Recommendations

**Short-term (Skip CI/CD for now):**

- Developers test HTTP files locally via REST Client IDE extension
- Manual validation before PR merge
- Document in testing guide: `pnpm dev:backend` + VS Code REST Client

**Medium-term (Potential Solutions):**

1. **Resource Allocation:** Allocate larger GitHub Actions runner (CPU/memory) to reduce initialization contention
2. **Image Warm-up:** Pre-build SQL Server container with initialized database (reduces cold-start)
3. **Different Edition:** Test Standard Edition or SQL Server 2019 (may have faster sa init)
4. **Health Check Endpoint:** Use dedicated HTTP endpoint on .NET backend (bypasses SQL Server sa check)
5. **Docker Compose Timing:** Increase `healthcheck.interval` in docker-compose.yml for local CI testing

**Long-term (Production CI/CD):**

- Once bottleneck resolved, re-enable workflow on all branches
- Add regression testing gate before merge to main
- Cache test results and report in PR checks

### Files

- **Workflow (Removed):** `.github/workflows/http-client-tests.yml` (deleted, commit: a7ee807)
- **HTTP Test Files:** `backend/src/FactoryApp.WebApi/http-tests/01-08*.http`
- **Testing Guide:** `docs/HTTP-CLIENT-TESTING-GUIDE.md`
- **Test Helper:** `backend/src/FactoryApp.WebApi/http-tests/helpers.js` (TokenManager for JWT handling)

### References

- **SQL Server Container Logs:** 5+ minute gap between "ready" message and actual connection acceptance
- **GitHub Issue:** Tracked in branch `fix/github-action-http-client-test`
- **Related:** See CLAUDE.md "Testing" section for current local test strategy

---

**Last Updated:** 2026-06-23 | **Decision:** Preserve HTTP test infrastructure locally, defer CI automation pending container analysis
