# Solo Developer Pull Request Review Workflow

## Overview

This guide explains the **AI Code Review GitHub Action** that automatically approves pull requests created by the repository owner (solo developer). This workflow streamlines the review process while maintaining quality standards.

---

## Workflow Trigger Events

The AI Code Review workflow activates when:

- A new PR is **opened**
- New **commits are pushed** to an existing PR (synchronize event)

---

## Auto-Approval Conditions

A PR is **automatically approved** if ALL of the following conditions are met:

| Condition                    | Status      |
| ---------------------------- | ----------- |
| PR created by `pluto-atom-4` | ✅ Required |
| PR is NOT in draft status    | ✅ Required |

**If any condition fails**, auto-approval is skipped (external PR or draft).

---

## Step-by-Step Workflow

### Step 1: Job Condition Gate

**Condition Check:**

```yaml
if: github.actor == 'pluto-atom-4' && github.event.pull_request.draft == false
```

- Verifies that the PR creator is the repository owner
- Confirms the PR is not in draft status
- Skips the entire job if either condition fails
- This is the **first and primary security check**

**Output:**

```
Job skipped for external contributors
OR
Job runs for pluto-atom-4 non-draft PRs
```

### Step 2: Checkout Repository

**Action:** `actions/checkout@v4`

- Fetches the full repository history (`fetch-depth: 0`)
- Allows access to repository context and metadata
- Prepares environment for subsequent steps

### Step 3: Check CI Status (Optional)

**Script Step** (Information logging)

```javascript
const pr = context.payload.pull_request;
console.log("PR: " + pr.number);
console.log("Author: " + pr.user.login);
console.log("Draft: " + pr.draft);
```

**Purpose:** Log PR metadata to workflow logs for debugging/audit trail

**Output Example:**

```
PR: 11
Author: pluto-atom-4
Draft: false
```

### Step 4: Approve PR

**GitHub API Call:**

```javascript
github.rest.pulls.createReview({
  owner: context.repo.owner,
  repo: context.repo.repo,
  pull_number: context.issue.number,
  event: "APPROVE",
  body: "✅ AI Code Review Approved\n\nAll CI checks must pass before merge:\n- Type checking\n- Build\n- Tests\n\nReady for manual merge when CI passes.",
});
```

**Approval Message:**

```
✅ AI Code Review Approved

All CI checks must pass before merge:
- Type checking
- Build
- Tests

Ready for manual merge when CI passes.
```

**Uses:**

- `${{ secrets.BOT_TOKEN }}` — GitHub token for API access (requires setup in repository secrets)
- Calls GitHub REST API to create approval review

---

## What Happens After Auto-Approval?

### 1. PR Receives Approval Review ✅

- The PR shows a green checkmark in the review section
- Approval is visible in the PR timeline
- Approval message explains CI requirements

### 2. CI/CD Checks Still Run 🔄

**All automated checks must pass:**

- Type checking (TypeScript/C#)
- Linting & code formatting
- Unit tests (backend + frontend)
- Integration tests
- Build verification
- GraphQL schema validation

### 3. Manual Merge Ready 🚀

Once CI checks pass, the PR is ready for manual merge via GitHub UI:

1. Navigate to PR #11
2. Click "Merge pull request"
3. Choose merge strategy (Squash, Merge, Rebase)
4. Confirm merge
5. Delete branch (optional but recommended)

---

## Error Handling & Fallback

### If Approval Fails

If the GitHub API call to create a review fails (e.g., insufficient permissions, network error):

1. **Workflow logs the error** — Full error message captured
2. **No retry mechanism** — Single attempt
3. **PR remains open** — Can be manually approved/merged
4. **Developer can investigate** — Check workflow logs for details

**Common Issues:**

- `BOT_TOKEN` not configured in repository secrets
- `BOT_TOKEN` has insufficient permissions
- Network or GitHub API unavailability

### Debugging Tips

Check workflow logs if auto-approval doesn't occur:

1. Navigate to **GitHub → Actions → AI Code Review**
2. Click the specific workflow run
3. Expand the step logs
4. Look for error messages in "Approve PR" step

---

## Security Considerations

### Access Control

- ✅ **Only approves PRs from `pluto-atom-4`** — Prevents external abuse
- ✅ **Skips draft PRs** — Incomplete work not accidentally approved
- ✅ **Uses BOT_TOKEN** — Explicit token with defined permissions
- ✅ **Logs all decisions** — Audit trail for every workflow run

### CI Still Required

**Auto-approval does NOT bypass:**

- ❌ Linting failures
- ❌ Test failures
- ❌ Type errors
- ❌ Build failures

All CI checks must pass before merge.

### BOT_TOKEN Setup

To use this workflow:

1. **Create a personal access token** (or use an app token)
2. **Add to repository secrets:**
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `BOT_TOKEN`
   - Value: Your personal access token
3. **Ensure token has permissions:**
   - `repo` (full control of private repositories)
   - `workflow` (for GitHub Actions)
   - `pull-requests:write` (to create reviews)

---

## Example: Full Workflow Run

### Scenario: Creating PR #11

```bash
# Create and push feature branch
git checkout -b feat/docker-compose-setup
# ... make changes ...
git commit -m "feat: Implement minimal docker-compose"
git push origin feat/docker-compose-setup

# Create PR
gh pr create --base main --head feat/docker-compose-setup \
  --title "feat: Implement minimal docker-compose setup (Issue #10)"
```

### AI Code Review Workflow Runs:

```
✅ Step 1: Job Condition Check
   Actor: pluto-atom-4 ✅
   Draft: false ✅
   → Job proceeds

✅ Step 2: Checkout Repository
   Repository ready

✅ Step 3: Check CI Status
   PR: 11
   Author: pluto-atom-4
   Draft: false

✅ Step 4: Approve PR
   Creating approval review...
   Review created successfully
   Message: ✅ AI Code Review Approved...

WORKFLOW COMPLETE ✅
```

### Then:

1. **CI/CD runs** — All checks must pass
2. **Developer reviews logs** — Ensures approval was created
3. **Manual merge** — Developer merges via GitHub UI
4. **Branch deleted** — Cleanup

---

## FAQ

### Q: Why auto-approve if CI must still pass?

**A:** Auto-approval confirms the PR structure is valid (owner-created, not draft). CI ensures code quality. Both provide different validation layers.

### Q: Can external contributors use this?

**A:** No. The workflow explicitly checks `github.actor == 'pluto-atom-4'`. Only the owner is auto-approved.

### Q: What if I want manual review of my own PR?

**A:** Currently, all non-draft PRs from pluto-atom-4 are auto-approved. To skip, you could:

1. Create PR in draft mode
2. Request review via GitHub UI
3. Un-draft when ready

### Q: Does auto-approval bypass tests?

**A:** No. Auto-approval and CI checks are independent. CI still runs and must pass before merge.

### Q: Where do I see the approval?

**A:** In the PR on GitHub:

1. Click the PR number (e.g., #11)
2. Scroll to "Reviews" section
3. See the approval with the AI Code Review message

### Q: Can I undo an auto-approval?

**A:** Yes. Dismiss the review via the GitHub UI:

1. In the Reviews section
2. Click "Dismiss review" on the approval
3. This removes the approval without deleting the review

### Q: What if BOT_TOKEN is not configured?

**A:** The workflow will fail at the "Approve PR" step with:

```
Error: Token required but not supplied
```

Configure the token in repository secrets to fix.

---

## Workflow File Reference

**File Location:** `.github/workflows/ai-code-review.yml`

**Key Configuration:**

```yaml
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read
  pull-requests: write

jobs:
  ai-review:
    if: github.actor == 'pluto-atom-4' && github.event.pull_request.draft == false
```

**Customization:**

- **Change owner:** Edit `github.actor == 'pluto-atom-4'`
- **Add branch filter:** Add `branches: [main]` to `on.pull_request`
- **Add PR events:** Add `reopened` to `types: [opened, synchronize, reopened]`
- **Change token:** Replace `${{ secrets.BOT_TOKEN }}` with token name

---

## Secret Scanning & Push Protection

### How It Works

GitHub **Secret Scanning** automatically detects hardcoded credentials and prevents them from being committed:

1. **Push Protection** — Blocks pushes containing detected secrets (prevents leaks)
2. **Post-Detection Scanning** — Scans repository history for existing secrets
3. **Alert Dashboard** — Notifies via GitHub Security tab if secrets are found

### Detected Patterns

GitHub Secret Scanning detects:

- AWS credentials (`AKIA...` patterns)
- GitHub personal access tokens (`ghp_...` patterns)
- Private SSH keys and certificates
- Database connection strings with passwords
- OAuth tokens and API keys
- Azure storage account keys
- And many more service-specific patterns

### Enabling Secret Scanning

**Using GitHub CLI:**

```bash
gh repo edit --enable-secret-scanning --enable-secret-scanning-push-protection
```

**Result:**

- Secret Scanning: Enabled (detects credentials in code)
- Push Protection: Enabled (blocks risky pushes)

### Handling Blocked Pushes

If you accidentally try to push code containing a detected secret:

```bash
# GitHub will block the push with:
# "Push rejected by secret scanning. Resolve the secret and re-push your changes."

# 1. Remove the secret from your code
git add -A

# 2. Amend your commit (if not yet pushed)
git commit --amend --no-edit

# 3. Try pushing again
git push origin your-branch
```

### Exempting False Positives

Some patterns might be detected as secrets when they're actually examples or documentation:

1. **Contact GitHub Support** to report false positives
2. **Document the reason** in PR comments
3. **Reference legitimate usage** (e.g., documentation, testing patterns)

### Troubleshooting

| Issue                                  | Solution                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Push rejected but I don't see a secret | Run `git diff HEAD` to review recent changes; check for test credentials or API keys in comments |
| Accidental secret already in history   | Repository owner needs to use `git filter-branch` or BFG Repo-Cleaner to remove; then force-push |
| Push override needed (not recommended) | Use `git push --no-verify` (bypasses ALL safety checks)                                          |
| Need to whitelist a pattern            | Contact GitHub Support with reasoning and pattern details                                        |

### Best Practices

✅ **Do:**

- Keep `.env.local.example` with placeholder values (example only, no real secrets)
- Use `.env` or `.env.local` (in `.gitignore`) for actual credentials
- Use GitHub Secrets for CI/CD credentials, not environment files
- Reference `.env.local.example` in CONTRIBUTING.md for setup

❌ **Don't:**

- Commit API keys, tokens, or passwords to any branch
- Use `--no-verify` to bypass secret scanning (defeats the purpose)
- Store secrets in configuration files tracked by git
- Commit `.env` files or credential files

### Related Documentation

For Phase 2 security implementation details, see:

- **[docs/implementation-planning/task-1-github-cli-guide.md](./implementation-planning/task-1-github-cli-guide.md)** — Complete GitHub CLI guide
- **[SECURITY.md](../SECURITY.md)** — Vulnerability reporting and security policy

---

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
```

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
pnpm install  # or: npm install (auto-detects)
pnpm build    # or: npm run build
pnpm test     # or: npm run test
```

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
| Package managers | pnpm/npm + NuGet + GitHub Actions           | Full coverage                 |

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

---

## Related Documentation

- **[README.md](../README.md)** — Project overview and quickstart
- **[docs/SETUP.md](./SETUP.md)** — Local development setup
- **[CLAUDE.md](../CLAUDE.md)** — Full development guide with architecture details
- **[SECURITY.md](../SECURITY.md)** — Security policy and vulnerability reporting
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** — Development workflow and code standards

---

**Last Updated:** 2026-05-19  
**Status:** Active  
**Owner:** Pluto Atom (@pluto-atom-4)
**Token:** Requires `BOT_TOKEN` configured in repository secrets
