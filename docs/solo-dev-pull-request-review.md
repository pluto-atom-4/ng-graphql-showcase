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

| Condition | Status |
|-----------|--------|
| PR created by `pluto-atom-4` | ✅ Required |
| PR is NOT in draft status | ✅ Required |

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
console.log('PR: ' + pr.number);
console.log('Author: ' + pr.user.login);
console.log('Draft: ' + pr.draft);
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
  event: 'APPROVE',
  body: '✅ AI Code Review Approved\n\nAll CI checks must pass before merge:\n- Type checking\n- Build\n- Tests\n\nReady for manual merge when CI passes.'
})
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

## Related Documentation

- **[README.md](../README.md)** — Project overview and quickstart
- **[docs/SETUP.md](./SETUP.md)** — Local development setup
- **[CLAUDE.md](../CLAUDE.md)** — Full development guide with architecture details

---

**Last Updated:** 2026-05-19  
**Status:** Active  
**Owner:** Pluto Atom (@pluto-atom-4)
**Token:** Requires `BOT_TOKEN` configured in repository secrets
