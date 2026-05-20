# Issue #7: Harden Repository Security Settings - Phase 2 Implementation Plan

## Phase 2: GitHub Security Features (Secret Scanning, Dependabot, CodeQL)

**Duration:** ~2 hours  
**Status:** Ready for implementation  
**Dependency:** Phase 1 completed (merged PR #13)  
**Related Issue:** #7 (Harden repository security settings)

---

## Overview

Phase 2 implements **automated security scanning and dependency management** to detect vulnerabilities and prevent accidental secret leaks. This phase focuses on GitHub-native tools that require minimal configuration but provide maximum security coverage.

### What Gets Done in Phase 2

1. **Secret Scanning + Push Protection** (15 minutes)
   - Enable GitHub Secret Scanning
   - Enable Push Protection (blocks commits with detected secrets)
   - Verify existing secrets are not present in repository

2. **Dependabot Configuration** (45 minutes)
   - Create `.github/dependabot.yml` for automated dependency scanning
   - Configure separate version updates for:
     - npm packages (frontend)
     - NuGet packages (backend)
     - GitHub Actions
   - Set auto-merge strategy for patch/minor versions
   - Establish security alert review process

3. **CodeQL Analysis** (60 minutes)
   - Create `.github/workflows/codeql-analysis.yml` workflow
   - Configure for both TypeScript (frontend) and C# (backend)
   - Set up scheduled daily analysis
   - Integrate with branch protection (required check)
   - Document alert review and remediation process

---

## Detailed Implementation Tasks

### Task 1: Enable Secret Scanning + Push Protection (15 min)

**Location:** GitHub CLI (command line) + Documentation

**Approach:** Use GitHub CLI instead of manual UI navigation for full automation and auditability.

#### 1.1 Enable Secret Scanning with GitHub CLI

**Command:**
```bash
cd /path/to/ng-graphql-playground
gh repo edit --enable-secret-scanning --enable-secret-scanning-push-protection
```

**What it does:**
- Enables GitHub Secret Scanning (detects hardcoded secrets)
- Enables Push Protection (blocks pushes with detected secrets)
- Both configured in single command
- Requires repository admin permissions

**Expected Output:**
```
✓ Secret scanning enabled
✓ Push protection enabled
```

**Advantages of GitHub CLI approach:**
- ✅ One-liner (no manual UI navigation)
- ✅ Can be automated in CI/CD pipelines
- ✅ Documented in git history
- ✅ Repeatable across multiple repositories
- ✅ No browser required

#### 1.2 Verify Configuration

**Verify Secret Scanning is enabled:**
```bash
gh repo view --json url,visibility
```

**Alternative: View in browser:**
- URL: `https://github.com/pluto-atom-4/ng-graphql-playground/settings/security_analysis`
- Verify both "Secret Scanning" and "Push Protection" show "✅ Enabled"

#### 1.3 Verify No Existing Secrets in Repository

**Scan commit history for common secrets:**
```bash
# Search for AWS patterns
git log -p --all | grep -i 'AKIA[0-9A-Z]\{16\}'

# Search for generic patterns
git log -p -S "password" --all | head -20
git log -p -S "api_key" --all | head -20
git log -p -S "token" --all | head -20
```

**Expected Result:** No matches (repository is clean)

**If secrets found:**
1. View the commit: `git show <commit-hash>`
2. Remove the secret using `git filter-branch`:
   ```bash
   git filter-branch --tree-filter 'grep -r "SECRET_KEY" . && sed -i "s/SECRET_KEY/redacted/g" *' HEAD
   ```
3. Force push (dangerous - use only if necessary):
   ```bash
   git push origin --force-with-lease
   ```
4. **Alternative:** Use [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

**Current Status:** No secrets expected in ng-graphql-playground (fresh repository)

#### 1.4 Create Documentation

**Update `docs/solo-dev-pull-request-review.md`:**

Add new section:
```markdown
## Secret Scanning & Push Protection

### How It Works

1. **Secret Scanning** detects common credential patterns (AWS keys, GitHub tokens, etc.)
2. **Push Protection** blocks commits/pushes containing detected secrets
3. Patterns detected: AWS keys, GitHub tokens, private keys, database credentials

### Detected Patterns

GitHub Secret Scanning detects:
- AWS credentials (AKIA... patterns)
- GitHub tokens (ghp_... patterns)
- Private SSH keys
- Database connection strings
- API keys for major cloud providers

### Handling Push Protection Blocks

If you accidentally commit a secret and Push Protection blocks the push:

```bash
# 1. Remove the secret from your working directory
rm secret-file.txt
# OR edit file and remove the secret

# 2. Stage the removal
git add -A

# 3. Amend the commit (if not yet pushed)
git commit --amend --no-edit

# 4. Push again
git push origin your-branch
```

### Emergency Override (Not Recommended)

If you need to push despite secret detection:
```bash
git push --no-verify
```

⚠️ **WARNING:** This bypasses all safety checks. Only use if you're certain the secret is safe to share.

### Troubleshooting

**Q: Push blocked with "Push rejected by secret scanning"**
- A: Remove the secret from your commits and try again

**Q: Accidental commit to main?**
- A: Contact repository owner immediately for remediation

**Q: False positive detection?**
- A: Contact GitHub Support to whitelist the pattern
```

#### 1.5 Test Push Protection (Optional)

**Create a test to verify Push Protection works:**

```bash
# 1. Create a test branch
git checkout -b test-secret-scanning

# 2. Add a test file with fake AWS key (clearly marked as test)
cat > test-secret.txt << 'EOF'
# TEST FILE - Not a real secret
AWS_KEY=AKIAIOSFODNN7EXAMPLE
EOF

# 3. Try to commit and push
git add test-secret.txt
git commit -m "test: verify secret scanning blocks this"
git push origin test-secret-branch

# Expected: Push rejected by GitHub Push Protection
# Message: "Push rejected by secret scanning"
```

**After verification:**
```bash
# Clean up test branch
git push origin --delete test-secret-branch
git branch -D test-secret-branch
git reset --hard HEAD~1  # Remove test commit locally
```

**Expected Result:** ✅ Push blocked successfully, secret not leaked

**Deliverable:** 
- ✅ Secret scanning enabled via GitHub CLI
- ✅ Push protection enabled via GitHub CLI
- ✅ Documentation added to `docs/solo-dev-pull-request-review.md`
- ✅ No existing secrets in repository history
- ✅ (Optional) Push protection tested and verified

**Verification Checklist:**
- [ ] `gh repo edit --enable-secret-scanning --enable-secret-scanning-push-protection` executed successfully
- [ ] GitHub Settings page shows "✅ Enabled" for Secret Scanning
- [ ] GitHub Settings page shows "✅ Enabled" for Push Protection
- [ ] `git log` scan shows no secret patterns
- [ ] Documentation updated in `docs/solo-dev-pull-request-review.md`
- [ ] (Optional) Test push with fake secret was blocked

---

### Task 2: Create Dependabot Configuration (45 min)

**Location:** `.github/dependabot.yml` (new file)

**Purpose:** Automate dependency updates and vulnerability detection

**Configuration Strategy:**

```yaml
# .github/dependabot.yml
version: 2
updates:
  # Frontend npm dependencies
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
    reviewers:
      - "pluto-atom-4"
    assignees:
      - "pluto-atom-4"
    labels:
      - "dependencies"
      - "frontend"
    auto-merge: true
    # Auto-merge strategy: patch and minor updates only
    allow:
      - dependency-type: "all"
    ignore:
      # Optionally ignore specific package versions
      # Example: - dependency-name: "lodash"
      #          versions: ["5.x"]

  # Root package.json workspace dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "04:00"
    reviewers:
      - "pluto-atom-4"
    assignees:
      - "pluto-atom-4"
    labels:
      - "dependencies"
    auto-merge: true
    allow:
      - dependency-type: "all"

  # Backend NuGet packages
  - package-ecosystem: "nuget"
    directory: "/backend/src"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "05:00"
    reviewers:
      - "pluto-atom-4"
    assignees:
      - "pluto-atom-4"
    labels:
      - "dependencies"
      - "backend"
    auto-merge: true
    allow:
      - dependency-type: "all"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "06:00"
    reviewers:
      - "pluto-atom-4"
    assignees:
      - "pluto-atom-4"
    labels:
      - "dependencies"
      - "ci"
    auto-merge: false  # Review actions manually first
    allow:
      - dependency-type: "all"
```

**Key Decisions:**

1. **Weekly Schedule**
   - Monday 3 AM UTC (prevents weekend rushes)
   - Staggered by 1 hour per ecosystem to avoid GitHub API rate limits
   - Solo developer can review all PRs in one session

2. **Auto-Merge Strategy**
   - ✅ npm packages: Auto-merge patch/minor versions
   - ✅ NuGet packages: Auto-merge patch/minor versions
   - ❌ GitHub Actions: Manual review (security-sensitive)
   - Rationale: Patch/minor updates are low-risk; major updates may break workflows

3. **Labels & Assignments**
   - All Dependabot PRs auto-assigned to @pluto-atom-4
   - Tagged with `dependencies` label for easy filtering
   - Ecosystem-specific labels (frontend, backend, ci) for quick context

4. **Allow Rules**
   - All dependency types allowed (direct, indirect, dev, prod)
   - No version ignores configured (receive all updates)
   - Rationale: Solo developer wants visibility into all updates

**Tasks Within Task 2:**

**2.1 Create `.github/dependabot.yml`**
- Copy configuration above
- Commit with message: "chore(deps): add Dependabot configuration"

**2.2 Create Dependabot Documentation**
- Add section to `docs/solo-dev-pull-request-review.md`
- Document workflow:
  1. Dependabot creates PR
  2. Auto-merge (patch/minor) or manual review (major/actions)
  3. CI checks run (must pass before merge)
  4. After merge: deleted branch
- Add troubleshooting for Dependabot conflicts
- Link to `CONTRIBUTING.md` for update process

**2.3 Configure Repository Secrets** (if needed)
- Verify no secrets needed in Dependabot PRs
- Dependabot uses repository token automatically
- No additional setup required for npm/NuGet

**Deliverable:** 
- `.github/dependabot.yml` committed
- Documentation updated
- First Dependabot run triggers automatically within 24 hours

**Verification:**
- GitHub Settings → Code security and analysis → Dependabot
- Status shows "✅ Enabled"
- Check Settings → Secrets to verify token setup (should be automatic)

---

### Task 3: Create CodeQL Analysis Workflow (60 min)

**Location:** `.github/workflows/codeql-analysis.yml` (new file)

**Purpose:** Static code analysis for security vulnerabilities in TypeScript (frontend) and C# (backend)

**Workflow Configuration:**

```yaml
# .github/workflows/codeql-analysis.yml
name: CodeQL Analysis

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 2 * * 0'  # Weekly Sunday 2 AM UTC

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    timeout-minutes: 360

    strategy:
      fail-fast: false
      matrix:
        language: [ 'cpp', 'csharp', 'javascript-typescript' ]

    permissions:
      actions: read
      contents: read
      security-events: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          # Optional: Specify custom queries
          queries: security-and-quality

      # For C# projects, we need to build the code first
      - name: Setup .NET
        if: matrix.language == 'csharp'
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0'

      - name: Restore and build
        if: matrix.language == 'csharp'
        run: |
          dotnet restore backend/src/FactoryApp.sln
          dotnet build backend/src/FactoryApp.sln --no-restore

      # For JavaScript/TypeScript, install dependencies
      - name: Setup Node.js
        if: matrix.language == 'javascript-typescript'
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        if: matrix.language == 'javascript-typescript'
        run: npm ci --workspace=frontend

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${{ matrix.language }}"
```

**Key Features:**

1. **Multi-Language Analysis**
   - JavaScript/TypeScript (frontend)
   - C# (backend)
   - cpp (for future native code, if any)

2. **Triggers**
   - **Push to main/develop:** Always analyze on merge
   - **Pull requests:** Check new code before merge
   - **Schedule:** Weekly Sunday 2 AM UTC (off-hours analysis)

3. **Security Event Reporting**
   - GitHub Security tab automatically populated
   - Alerts show up in repository dashboard
   - Email notifications sent for new vulnerabilities

4. **Build Integration**
   - C# code built before analysis (required for semantic analysis)
   - TypeScript dependencies installed (required for import resolution)
   - Ensures accurate vulnerability detection

**Tasks Within Task 3:**

**3.1 Create `.github/workflows/codeql-analysis.yml`**
- Copy configuration above
- Commit with message: "chore(ci): add CodeQL security analysis workflow"

**3.2 Update Branch Protection Rule (main branch)**
- Navigate to: Settings → Branches → main → Branch protection rule → Edit
- Add required status check: `analyze` (CodeQL job name)
- Required for: "All PR must pass CodeQL analysis before merge"
- Save changes

**3.3 Create CodeQL Documentation**
- Create new document: `docs/codeql-analysis-guide.md`
- Document:
  1. What CodeQL does (detects security vulnerabilities)
  2. Supported languages (TypeScript, C#)
  3. How to view results:
     - GitHub Security tab: `https://github.com/pluto-atom-4/ng-graphql-playground/security/code-scanning`
     - PR checks: Shows pass/fail directly in PR
  4. How to suppress false positives (add `// lgtm[js/...]` comments)
  5. Running CodeQL locally:
     ```bash
     # Install CodeQL CLI
     # Run: codeql database create ... --language=csharp backend/src/
     # Analyze: codeql database analyze ...
     ```
  6. Remediation process:
     - Fix vulnerability in code
     - Commit and push
     - CodeQL re-scans automatically
     - Alert resolved when fixed

**3.4 Test CodeQL Integration**
- Create a simple test PR with intentional vulnerability
- Verify CodeQL detects it
- Verify PR check shows failure
- Fix vulnerability and verify check passes
- Delete test PR

**3.5 Update CI/CD Documentation**
- Add CodeQL section to existing CI/CD docs
- Link from `CONTRIBUTING.md` to CodeQL guide
- Document branch protection requirement

**Deliverable:**
- `.github/workflows/codeql-analysis.yml` committed
- Branch protection rule updated with CodeQL check
- Documentation created: `docs/codeql-analysis-guide.md`
- Integration test completed

**Verification:**
- GitHub Settings → Branches → main shows CodeQL check required
- GitHub Security tab shows "Code scanning" section
- First CodeQL run completes within 24 hours

---

## Implementation Order

**Recommended sequence to minimize downtime:**

1. **First**: Secret Scanning + Push Protection (15 min)
   - No code changes needed
   - Immediate protection for repository history

2. **Second**: Dependabot Configuration (45 min)
   - Create `.github/dependabot.yml`
   - First run happens within 24 hours
   - No blocking of PRs (only creates them)

3. **Third**: CodeQL Analysis Workflow (60 min)
   - Create workflow file
   - Update branch protection rule (BLOCKS PRs until fixed)
   - Do last to minimize disruption during setup

**Total Time**: ~2 hours

---

## Dependencies & Prerequisites

**Before Starting Phase 2:**

- ✅ Phase 1 merged into main (SECURITY.md, CONTRIBUTING.md, CODEOWNERS)
- ✅ Repository on GitHub public or private (Settings → Code security visible)
- ✅ Branch protection rule exists for main (already configured)
- ✅ `.gitignore` properly configured (to prevent secret commits)
- ⚠️ No existing secrets in commit history (verify with `git log -p` search)

**Not Required:**
- CI/CD pipelines already running (CodeQL is independent)
- Specific GitHub plan (CodeQL free tier available)

---

## Testing & Verification

### Test Case 1: Secret Scanning Works

```bash
# Create test file with fake AWS key
echo 'AKIA2EXAMPLE1234ABCD' >> test-secret.txt
git add test-secret.txt

# Try to push
git push origin test-branch

# Expected: Push blocked by Push Protection with message:
# "Push rejected by GitHub secret scanning"
```

**Expected Result:** ✅ Push blocked, no secret leaked

### Test Case 2: Dependabot Creates PRs

**Timeline:** First Dependabot run within 24 hours

**Expected Result:**
- ✅ PR created on Monday 3 AM UTC (first week)
- ✅ PR auto-assigned to @pluto-atom-4
- ✅ PR labeled with `dependencies`
- ✅ CI checks run automatically
- ✅ PR auto-merged if checks pass (patch/minor updates)

### Test Case 3: CodeQL Detects Vulnerabilities

**Create intentional vulnerability for testing:**

```typescript
// frontend/src/app/test-vulnerability.ts
// Intentional: SQL injection vulnerability
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

**Expected Result:**
- ✅ CodeQL detects SQL injection pattern
- ✅ GitHub Security tab shows alert
- ✅ PR check fails until fixed
- ✅ Fix removes alert after re-scan

---

## Success Criteria

**Phase 2 is complete when:**

- ✅ Secret Scanning enabled in repository settings
- ✅ Push Protection enabled and blocking secrets
- ✅ `.github/dependabot.yml` committed and active
- ✅ First Dependabot PRs received (verify within 24-48 hours)
- ✅ `.github/workflows/codeql-analysis.yml` committed
- ✅ CodeQL checks required on branch protection rule
- ✅ Documentation created: `docs/codeql-analysis-guide.md`
- ✅ All tests pass: secret scanning blocks, Dependabot PRs created, CodeQL detects vulnerabilities
- ✅ CI/CD documentation updated

**Metrics:**
- Files created: 2 (dependabot.yml, codeql-analysis.yml)
- Files updated: 3+ (branch protection, docs)
- New automation: 3 (secret scanning, dependabot, codeql)
- Reduced manual effort: ~5 hours/week in security reviews

---

## Rollback Plan

If Phase 2 causes issues:

**To disable Secret Scanning:**
- Settings → Code security and analysis → Secret scanning → Disable

**To disable Dependabot:**
- Delete `.github/dependabot.yml`
- Commit: `git rm .github/dependabot.yml && git commit -m "Disable Dependabot"`

**To disable CodeQL:**
- Delete `.github/workflows/codeql-analysis.yml`
- Remove CodeQL from branch protection rule (Settings → Branches → Edit rule)

---

## GitHub Settings Checklist

Before starting, verify these settings are accessible:

- [ ] Repository Settings → Security & analysis visible
- [ ] Settings → Branches → main rule editable
- [ ] Settings → Code security tab available
- [ ] User has admin permissions on repository

**Troubleshooting:**
- If Secret Scanning not visible: Repository must be public or on GitHub Pro plan
- If CodeQL not visible: Same requirement as Secret Scanning
- If Dependabot not visible: Usually available on all plans

---

## Estimated Timeline

| Task | Duration | Start | End | Status |
|------|----------|-------|-----|--------|
| Secret Scanning + Push Protection | 15 min | - | - | Ready |
| Dependabot Configuration | 45 min | After Task 1 | - | Ready |
| CodeQL Analysis Setup | 60 min | After Task 2 | - | Ready |
| Testing & Verification | 30 min | Parallel | - | Ready |
| Documentation Review | 15 min | After all tasks | - | Ready |
| **TOTAL PHASE 2** | **~2.5 hours** | - | - | - |

---

## Post-Phase-2 Maintenance

**Weekly (1-2 hours):**
- Review Dependabot PRs (auto-merge most; review major updates)
- Check GitHub Security tab for new CodeQL alerts
- Monitor CI/CD checks on main branch

**Monthly (30 min):**
- Review secret scanning logs
- Analyze CodeQL vulnerability trends
- Update documentation if needed

**Quarterly (1 hour):**
- Review and update Dependabot configuration
- Assess new security features in GitHub
- Plan Phase 3 (branch protection enhancement)

---

## Links & Resources

**GitHub Documentation:**
- [Secret Scanning Documentation](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Documentation](https://codeql.github.com/)
- [CodeQL Queries for TypeScript](https://github.com/github/codeql/tree/main/javascript/ql/src)
- [CodeQL Queries for C#](https://github.com/github/codeql/tree/main/csharp/ql/src)

**Related Issues:**
- Issue #7: Harden repository security settings
- PR #13: Phase 1 - Security foundation documents (merged)

---

## Sign-Off

**Phase 2 Plan Review:**
- [ ] Plan reviewed by solo developer
- [ ] No blockers identified
- [ ] Ready to proceed with implementation

**Phase 2 Completion:**
- [ ] All tasks completed
- [ ] Tests passed
- [ ] Documentation updated
- [ ] PR created and merged

---

**Last Updated:** 2026-05-20  
**Version:** 1.0  
**Status:** Ready for Implementation
