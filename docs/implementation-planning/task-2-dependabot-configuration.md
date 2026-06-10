# Task 2 Implementation Plan: Dependabot Configuration

**Date:** 2026-05-20  
**Phase:** Issue #7 Phase 2 - GitHub Security Features  
**Task:** 2 - Configure Dependabot for Automated Dependency Updates  
**Duration:** ~45 minutes  
**Dependency:** Phase 2 Task 1 completed (Secret Scanning enabled)  
**Package Manager:** pnpm (monorepo with npm workspace fallback)

---

## Executive Summary

**Dependabot** is GitHub's native tool for automated dependency management. It:

- ✅ Detects vulnerable packages automatically
- ✅ Creates PRs with security fixes and updates
- ✅ Tests updates via CI/CD before merging
- ✅ Auto-merges safe updates (patch/minor versions)

This task creates `.github/dependabot.yml` configuration to manage:

1. **pnpm** packages (frontend via pnpm, or npm as fallback)
2. **NuGet** packages (backend .NET)
3. **GitHub Actions** (CI/CD workflows)

---

## Current State Assessment

**What We Have:**

- ✅ Secret Scanning enabled (Task 1)
- ✅ GitHub Actions workflows exist (.github/workflows/)
- ✅ Package managers configured:
  - pnpm (preferred) or npm workspaces (frontend/package.json, root package.json)
  - NuGet (backend/src/FactoryApp.sln)
  - GitHub Actions (@v3, @v4, @v7 style references)

**What's Missing:**

- ❌ No `.github/dependabot.yml` file
- ❌ No automated dependency updates
- ❌ No security vulnerability scanning for dependencies
- ❌ No auto-merge strategy for safe updates

---

## Implementation Strategy

### Overview

Dependabot has two primary functions:

1. **Version Updates** — Keep dependencies current
   - Patch: 1.0.0 → 1.0.1 (bug fixes, safe to auto-merge)
   - Minor: 1.0.0 → 1.1.0 (new features, usually safe)
   - Major: 1.0.0 → 2.0.0 (breaking changes, manual review)

2. **Security Updates** — Fix vulnerabilities
   - Automatically created for known CVEs
   - Priority: Critical > High > Medium > Low
   - Merged immediately if tests pass

### Package Manager Decision: pnpm vs npm

**Dependabot Ecosystem Options:**

- `npm` — Works with npm workspaces and pnpm-lock.yaml (preferred)
- `pip` — Python packages
- `nuget` — .NET packages
- `github-actions` — GitHub Actions

**Configuration Approach for Solo Developer:**

- Auto-merge for **patch** and **minor** versions (low risk)
- Manual review for **major** versions (could break functionality)
- Manual review for **GitHub Actions** (security-sensitive)
- Weekly schedule to batch PRs (Monday 3 AM UTC)
- Staggered timing to avoid API rate limits

---

## Detailed Implementation Tasks

### Task 2.1: Create `.github/dependabot.yml`

**File Location:** `.github/dependabot.yml`  
**File Size:** ~90 lines  
**Complexity:** Medium (YAML syntax)

**Configuration Structure:**

```yaml
# .github/dependabot.yml
# Automated dependency management for ng-graphql-showcase
#
# This configuration enables Dependabot to:
# 1. Detect vulnerable dependencies
# 2. Create PRs with security fixes
# 3. Auto-merge safe updates (patch/minor)
# 4. Test updates via CI/CD before merge

version: 2

updates:
  # ═══════════════════════════════════════════════════════════════════════════
  # Frontend & Root pnpm/npm dependencies
  # ═══════════════════════════════════════════════════════════════════════════
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
      timezone: "UTC"

    # GitHub PR configuration
    reviewers:
      - "pluto-atom-4"
    assignees:
      - "pluto-atom-4"
    labels:
      - "dependencies"
      - "frontend"

    # Auto-merge configuration
    auto-merge: true

    # Dependency rules
    allow:
      - dependency-type: "all" # Include direct, indirect, dev, prod

    # Optional: ignore specific packages
    # ignore:
    #   - dependency-name: "lodash"
    #     versions: ["5.x"]

    commit-message:
      prefix: "chore(deps):"
      prefix-development: "chore(deps-dev):"
      include: "scope"

  # ═══════════════════════════════════════════════════════════════════════════
  # Backend NuGet packages
  # ═══════════════════════════════════════════════════════════════════════════
  - package-ecosystem: "nuget"
    directory: "/backend/src"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "04:00" # Staggered 1 hour later
      timezone: "UTC"

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

    commit-message:
      prefix: "chore(deps-backend):"
      include: "scope"

  # ═══════════════════════════════════════════════════════════════════════════
  # GitHub Actions (Do NOT auto-merge - security sensitive)
  # ═══════════════════════════════════════════════════════════════════════════
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "05:00" # Staggered 1 hour later
      timezone: "UTC"

    reviewers:
      - "pluto-atom-4"
    assignees:
      - "pluto-atom-4"
    labels:
      - "dependencies"
      - "ci/cd"
      - "security"

    auto-merge: false # Manual review only for GitHub Actions

    allow:
      - dependency-type: "all"

    commit-message:
      prefix: "chore(ci):"
      include: "scope"
```

**Key Configuration Decisions:**

| Decision                                  | Rationale                                          |
| ----------------------------------------- | -------------------------------------------------- |
| `package-ecosystem: npm` for "/"          | Covers both pnpm and npm (Dependabot auto-detects) |
| Single npm config (not separate frontend) | Dependabot treats monorepo root intelligently      |
| `auto-merge: true` for npm/NuGet          | Patch/minor updates rarely break functionality     |
| `auto-merge: false` for actions           | CI/CD changes are security-sensitive               |
| Weekly schedule on Monday                 | Batches updates; avoids weekend disruptions        |
| Staggered times (3, 4, 5 AM UTC)          | Prevents API rate limit hits                       |
| Include all dependency types              | Visibility into all updates (dev, prod, indirect)  |
| Per-ecosystem labels                      | Easy filtering in GitHub PR dashboard              |
| Solo developer assignee                   | PR assigned to @pluto-atom-4 automatically         |

**Why pnpm/npm Ecosystem Choice:**

Dependabot's `npm` ecosystem:

- ✅ Works with pnpm-lock.yaml (if using pnpm)
- ✅ Works with npm-lock.yaml (if using npm)
- ✅ Auto-detects which one is used
- ✅ Handles monorepos intelligently (treats "/" as root workspace)
- ✅ Finds all package.json files (frontend/, root, etc.)

**Creating the File:**

```bash
# 1. Create the file
cat > .github/dependabot.yml << 'EOF'
# [YAML content from above]
EOF

# 2. Validate YAML syntax
python3 -c "import yaml; yaml.safe_load(open('.github/dependabot.yml'))" && echo "✅ Valid YAML"

# 3. Commit
git add .github/dependabot.yml
git commit -m "chore(deps): add Dependabot configuration for automated dependency updates"
```

---

### Task 2.2: Verify Dependabot Configuration

**Purpose:** Ensure Dependabot can access repository and files

**Verification Steps:**

1. **Check `.github/dependabot.yml` syntax**

   ```bash
   python3 << 'EOF'
   import yaml
   with open('.github/dependabot.yml', 'r') as f:
       config = yaml.safe_load(f)
   print(f"✅ Valid YAML - {len(config['updates'])} package managers configured")
   for update in config['updates']:
       print(f"  • {update['package-ecosystem']}: {update['directory']}")
   EOF
   ```

2. **Verify pnpm/npm configuration**

   ```bash
   # Check if pnpm lock file or npm lock file exists
   if [ -f "pnpm-lock.yaml" ]; then
     echo "✅ pnpm detected (pnpm-lock.yaml found)"
   elif [ -f "package-lock.json" ]; then
     echo "✅ npm detected (package-lock.json found)"
   fi

   # Check package.json files
   find . -name "package.json" -not -path "node_modules/*" | head -5
   ```

3. **Check NuGet configuration**

   ```bash
   ls -la backend/src/*.sln backend/src/*.csproj | head -3
   ```

   Expected output:

   ```
   -rw-r--r-- ... backend/src/FactoryApp.sln
   -rw-r--r-- ... backend/src/FactoryApp.WebApi.csproj
   ```

4. **Verify in GitHub Settings**
   - Navigate to: https://github.com/pluto-atom-4/ng-graphql-showcase/settings/security_and_analysis
   - Look for: "Dependabot version updates" with status
   - Expected: "✅ Enabled" (appears after first commit)

**Expected Result:** All paths validated, file syntactically correct, package managers detected

---

### Task 2.3: Document Dependabot Workflow

**File:** `docs/solo-dev-pull-request-review.md` (add new section)

**New Section: Dependabot Configuration & Workflow**

```markdown
## Dependabot: Automated Dependency Updates

### How Dependabot Works

Dependabot automatically:

1. **Scans dependencies** for available updates and vulnerabilities
2. **Creates PRs** with update proposals (weekly on Monday)
3. **Runs CI/CD** to verify updates don't break anything
4. **Auto-merges** safe updates (patch/minor versions)
5. **Alerts you** to manual review needed (major versions, actions)

### Configuration

Dependabot is configured via `.github/dependabot.yml`:

- **pnpm/npm packages**: Weekly updates, auto-merge patch/minor
- **NuGet packages** (backend): Weekly updates, auto-merge patch/minor
- **GitHub Actions**: Weekly updates, manual review only

### Dependabot PR Workflow

#### Automatic Process (Patch/Minor Updates)
```

Monday 3 AM UTC → Dependabot creates PR
↓
CI checks run (build, tests, lint)
↓
All checks pass → PR auto-merged
↓
Update deployed to main branch

```

#### Manual Review Process (Major Updates, Actions)
```

Monday 3-5 AM UTC → Dependabot creates PR
↓
Assigned to @pluto-atom-4
↓
Review: Can I safely use this major version?
↓
Yes → Merge PR | No → Close/convert to draft

````

### Reviewing Dependabot PRs

**What to look for:**
1. **Changelog** — Read package changelog for breaking changes
2. **CI Status** — All checks must pass (green checkmarks)
3. **Dependency Tree** — Check if other packages depend on this
4. **Security Advisories** — Look for related CVE fixes

**When to auto-merge:**
- ✅ Patch versions (1.0.0 → 1.0.1): Safe, likely merge
- ✅ Minor versions (1.0.0 → 1.1.0): Usually safe, unless changelog shows risks
- ❌ Major versions (1.0.0 → 2.0.0): Review carefully for breaking changes

**When to skip/close:**
- ❌ If tests fail in Dependabot PR
- ❌ If major version has incompatible API changes
- ❌ If your code needs updates for new version

### Common Dependabot Scenarios

#### Scenario 1: Auto-Merged PR Appears on Main
**What happened:** Patch/minor update was deemed safe and auto-merged

**Action:** Pull latest main branch and test locally
```bash
git pull origin main
pnpm install  # or: npm install
pnpm build    # or: npm run build
pnpm test     # or: npm run test
````

#### Scenario 2: Major Version Requires Manual Review

**What happened:** Dependabot created PR but didn't auto-merge (major version)

**Action:** Review changelog and merge if safe

```bash
# 1. Review the PR on GitHub
# 2. Check the changelog link in PR description
# 3. If safe, click "Merge pull request"
# 4. Delete branch
```

#### Scenario 3: Update Causes Test Failure

**What happened:** CI checks failed; update introduces breaking change

**Action:** Close PR and keep current version

```bash
# On GitHub: Click "Close pull request"
# Dependabot will re-create in next cycle if unresolved
```

#### Scenario 4: Security Vulnerability Detected

**What happened:** Dependabot detected CVE; creating urgent security PR

**Action:** Merge immediately if tests pass

```bash
# On GitHub: Review security advisory link
# If tests pass (green): Click "Merge pull request"
# Security fixes take priority
```

### Dependabot Settings for This Repository

| Setting          | Value                                       | Reason                        |
| ---------------- | ------------------------------------------- | ----------------------------- |
| Schedule         | Weekly, Monday 3 AM UTC                     | Batch updates; off-peak       |
| Auto-merge       | On for patch/minor; Off for major/actions   | Balance safety and automation |
| Dependency types | All (direct, indirect, dev, prod)           | Full visibility               |
| Labels           | `dependencies`, `frontend`, `backend`, `ci` | Easy filtering                |
| Package manager  | pnpm/npm + NuGet + GitHub Actions           | Full coverage                 |

### Troubleshooting

| Issue                        | Solution                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------- |
| Dependabot PRs not appearing | Wait 24 hours for first run; check Settings → Dependabot enabled                 |
| PR fails CI checks           | Review error messages; may indicate incompatibility                              |
| Auto-merge not happening     | Check if PR is marked as draft; convert to normal PR                             |
| pnpm vs npm confusion        | Dependabot auto-detects; uses pnpm-lock.yaml if present, npm-lock.json otherwise |
| Too many PRs at once         | Reduce frequency in `.github/dependabot.yml` (e.g., monthly instead of weekly)   |

### Disabling Dependabot Temporarily

If you need to pause updates:

```bash
# Edit .github/dependabot.yml
# Change interval from "weekly" to "never"
# Commit and push
# Dependabot will stop creating PRs
```

To re-enable:

```bash
# Change interval back to "weekly"
# Commit and push
# Dependabot resumes on next cycle
```

### Viewing Dependabot History

GitHub tracks all Dependabot activity:

- **URL:** https://github.com/pluto-atom-4/ng-graphql-showcase/network/updates
- Shows: All update PRs, merge history, skipped versions

### Related Documentation

- **[docs/implementation-planning/issue-7-phase-2-github-security-features.md](./implementation-planning/issue-7-phase-2-github-security-features.md)** — Full Phase 2 plan
- **[docs/implementation-planning/task-2-dependabot-configuration.md](./implementation-planning/task-2-dependabot-configuration.md)** — Task 2 detailed guide
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** — Merge workflow and CI/CD

````

---

### Task 2.4: Test Dependabot Configuration

**Purpose:** Verify Dependabot will work as expected

**Verification Method 1: Monitor First Run (24-48 hours)**

```bash
# 1. Commit the dependabot.yml file
git add .github/dependabot.yml
git commit -m "chore(deps): add Dependabot configuration for automated dependency updates"
git push origin main

# 2. Wait 24-48 hours for first Dependabot run
# (GitHub processes Dependabot on a schedule)

# 3. Check GitHub for new Dependabot PRs
# URL: https://github.com/pluto-atom-4/ng-graphql-showcase/pulls?q=author%3Aapp%2Fdependabot
````

**Expected Result (within 24-48 hours):**

- ✅ One PR per package manager (npm, NuGet, actions)
- ✅ Each PR title: "Bump [package-name] from X to Y"
- ✅ PR assigned to @pluto-atom-4
- ✅ PR labeled with `dependencies` and ecosystem label
- ✅ CI checks running on each PR

**Verification Method 2: Syntax Check (Before Commit)**

```bash
# Validate YAML syntax
python3 << 'EOF'
import yaml
import sys

try:
    with open('.github/dependabot.yml', 'r') as f:
        config = yaml.safe_load(f)

    print("✅ YAML is valid")
    print(f"\nConfiguration found for {len(config['updates'])} package managers:")

    for i, update in enumerate(config['updates'], 1):
        ecosystem = update['package-ecosystem']
        directory = update['directory']
        interval = update['schedule']['interval']
        auto_merge = update.get('auto-merge', False)

        print(f"\n{i}. {ecosystem}")
        print(f"   Directory: {directory}")
        print(f"   Schedule: {interval}")
        print(f"   Auto-merge: {'✅ Yes' if auto_merge else '❌ No'}")

except yaml.YAMLError as e:
    print(f"❌ YAML Error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
EOF
```

---

### Task 2.5: Create Task 2 Documentation File

**File Location:** `docs/implementation-planning/task-2-dependabot-configuration.md`

**Purpose:** Detailed guide for Dependabot setup (similar to task-1-github-cli-guide.md)

**This file will contain:**

1. What is Dependabot (overview)
2. Step-by-step implementation
3. Configuration explanation
4. Verification procedures
5. Testing timeline
6. Troubleshooting
7. Maintenance procedures

---

## Success Criteria

**Task 2 is complete when:**

- [ ] `.github/dependabot.yml` created and committed
- [ ] YAML syntax validated (no errors)
- [ ] All three package managers configured (npm/pnpm, NuGet, GitHub Actions)
- [ ] Directory paths verified to exist
- [ ] Auto-merge strategy documented (patch/minor yes, major/actions no)
- [ ] Documentation added to `docs/solo-dev-pull-request-review.md`
- [ ] Task 2 guide created: `docs/implementation-planning/task-2-dependabot-configuration.md`
- [ ] First Dependabot PR appears within 24-48 hours
- [ ] PR verification: Auto-assigned, labeled, CI checks running
- [ ] All documentation linked and cross-referenced

---

## Files to Create/Modify

| File                                                              | Action | Purpose                         |
| ----------------------------------------------------------------- | ------ | ------------------------------- |
| `.github/dependabot.yml`                                          | CREATE | Dependabot configuration        |
| `docs/solo-dev-pull-request-review.md`                            | MODIFY | Add Dependabot workflow section |
| `docs/implementation-planning/task-2-dependabot-configuration.md` | CREATE | Task 2 implementation guide     |

---

## Estimated Timeline

| Step                               | Duration         | Notes                          |
| ---------------------------------- | ---------------- | ------------------------------ |
| Create dependabot.yml              | 5 min            | Copy, validate, commit         |
| Verify configuration               | 5 min            | Check syntax, paths            |
| Document in solo-dev guide         | 10 min           | Add workflow section           |
| Create task guide                  | 10 min           | Full reference documentation   |
| Wait for first Dependabot run      | 24-48h           | GitHub processes on schedule   |
| Verify first PRs                   | 5 min            | Check assignments, labels, CI  |
| **Total (excluding wait)**         | **~35 minutes**  | -                              |
| **Total (including verification)** | **24-48+ hours** | Depends on Dependabot schedule |

---

## Rollback Plan

If Dependabot causes issues:

**Disable Dependabot temporarily:**

```bash
# Option 1: Disable in `.github/dependabot.yml`
# Change all "weekly" to "never"

# Option 2: Delete Dependabot configuration
rm .github/dependabot.yml
git add .github/dependabot.yml
git commit -m "chore(deps): disable Dependabot temporarily"
git push origin main
```

**Close all Dependabot PRs:**

1. Filter PRs: https://github.com/pluto-atom-4/ng-graphql-showcase/pulls?q=author%3Aapp%2Fdependabot
2. Click each PR → "Close pull request"
3. Dependabot will not recreate them while disabled

---

## Post-Implementation Maintenance

**Weekly (Monday after Dependabot run):**

- Check for new PRs (typically 4-8 per week)
- Review major version updates
- Test auto-merged updates locally

**Monthly:**

- Review Dependabot settings in `.github/dependabot.yml`
- Adjust schedule if too many/too few PRs
- Check for ignored packages that need updates

---

## Configuration Reference

### Package Ecosystems Supported

| Ecosystem      | File          | Directory    | Auto-Merge | Notes              |
| -------------- | ------------- | ------------ | ---------- | ------------------ |
| npm            | package.json  | "/" (root)   | ✅ Yes     | pnpm/npm monorepo  |
| NuGet          | .sln, .csproj | /backend/src | ✅ Yes     | .NET packages      |
| github-actions | .yml          | /            | ❌ No      | Security-sensitive |

### Schedule Values

```yaml
schedule:
  interval: "weekly" # Also: daily, monthly
  day: "monday" # daily: not applicable
  time: "03:00" # 00:00 - 23:59 UTC
  timezone: "UTC" # Optional, defaults to UTC
```

### Auto-Merge Settings

```yaml
auto-merge: true              # Auto-merge if CI passes
# OR
auto-merge: false             # Always require manual review
```

---

## Links & Resources

**GitHub Documentation:**

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-dependency-updates)
- [Dependabot Security Updates](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates)

**Related Issues:**

- Issue #7: Harden repository security settings
- PR #13: Phase 1 - Security foundation documents (merged)

---

**Last Updated:** 2026-05-20  
**Version:** 1.0  
**Status:** Ready for Implementation
