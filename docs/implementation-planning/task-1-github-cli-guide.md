# Task 1 Implementation Guide: Secret Scanning with GitHub CLI

**Date:** 2026-05-20  
**Phase:** Issue #7 Phase 2 - GitHub Security Features  
**Task:** 1 - Enable Secret Scanning + Push Protection  
**Method:** GitHub CLI (automated, not manual UI)  

---

## Executive Summary

✅ **GitHub CLI fully supports Task 1 automation**

Instead of manually navigating the GitHub Settings UI (3-4 clicks), we use GitHub CLI to enable Secret Scanning and Push Protection in a single command:

```bash
gh repo edit --enable-secret-scanning --enable-secret-scanning-push-protection
```

This approach:
- ✅ Takes 30 seconds to execute
- ✅ Can be automated in CI/CD
- ✅ Creates no UI dependency
- ✅ Is fully repeatable and auditable
- ✅ Works across multiple repositories

---

## Comparison: Manual UI vs GitHub CLI

### Manual UI Approach
**Time:** 5-10 minutes  
**Steps:**
1. Open GitHub repository Settings page
2. Navigate to "Code security and analysis" section
3. Click "Enable" button for Secret Scanning
4. Click "Enable" button for Push Protection
5. Wait for settings to save
6. Navigate back to verify changes

**Downsides:**
- ❌ Browser-dependent
- ❌ Cannot be automated
- ❌ No audit trail in git
- ❌ User-facing interface changes break workflows
- ❌ Multi-step manual process

### GitHub CLI Approach
**Time:** < 1 minute  
**Command:**
```bash
gh repo edit --enable-secret-scanning --enable-secret-scanning-push-protection
```

**Advantages:**
- ✅ Single command
- ✅ Works in CI/CD pipelines
- ✅ Repeatable across all repositories
- ✅ No UI dependency
- ✅ Can be version controlled and audited
- ✅ Works with GitHub Enterprise

---

## Implementation Steps

### Prerequisites
- ✅ GitHub CLI installed: `which gh`
- ✅ Authenticated: `gh auth status`
- ✅ Repository admin permissions

### Step 1: Enable Secret Scanning

```bash
cd /home/pluto-atom-4/Documents/stoke-full-stack/ng-graphql-playground

# Enable both Secret Scanning and Push Protection
gh repo edit --enable-secret-scanning --enable-secret-scanning-push-protection

# Expected output:
# ✓ Secret scanning enabled
# ✓ Push protection enabled
```

### Step 2: Verify Configuration

**Option A: View via GitHub CLI**
```bash
gh repo view --json url,visibility,nameWithOwner
```

**Option B: View in browser**
- URL: https://github.com/pluto-atom-4/ng-graphql-playground/settings/security_analysis
- Look for:
  - Secret scanning: ✅ Enabled
  - Push protection: ✅ Enabled

### Step 3: Verify No Existing Secrets

Scan repository history for common secret patterns:

```bash
echo "Scanning for AWS credentials..."
git log -p --all | grep -E 'AKIA[0-9A-Z]{16}' && echo "⚠️ AWS keys found!" || echo "✅ No AWS keys"

echo "Scanning for password strings..."
git log -p --all -S "password" | head -5 && echo "⚠️ Passwords found!" || echo "✅ No hardcoded passwords"

echo "Scanning for API keys..."
git log -p --all -S "api_key" | head -5 && echo "⚠️ API keys found!" || echo "✅ No API keys"
```

**Expected Result:** All checks pass (no secrets found)

### Step 4: Update Documentation

Add Secret Scanning section to `docs/solo-dev-pull-request-review.md`:

```markdown
## Secret Scanning & Push Protection

### Enabling Secret Scanning with GitHub CLI

Secret scanning detects hardcoded credentials (AWS keys, tokens, etc.) and prevents accidental commits:

```bash
gh repo edit --enable-secret-scanning --enable-secret-scanning-push-protection
```

### How It Works

1. **GitHub Secret Scanning** monitors all commits for credential patterns
2. **Push Protection** blocks pushes that contain detected secrets
3. Prevents secrets from ever reaching the repository history

### Detected Patterns

- AWS credentials (AKIA... patterns)
- GitHub personal access tokens (ghp_...)
- Private SSH keys
- Database connection strings
- OAuth tokens
- API keys for major cloud providers

### Handling Blocked Pushes

If Push Protection blocks your commit:

```bash
# 1. Remove the secret from your code
git add -A
git commit --amend --no-edit

# 2. Try push again
git push origin your-branch
```

### Emergency Override (Not Recommended)

```bash
git push --no-verify  # Bypasses checks (only if absolutely necessary)
```

⚠️ Use only if you're certain the secret is safe to share publicly.

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Push blocked with "secret scanning" error | Remove the secret and re-commit |
| Push accepted but secret is visible | Use `git filter-branch` to remove from history |
| False positive detected | Contact GitHub Support for pattern whitelist |
```

---

## Testing Push Protection

### Create Test Case

```bash
# 1. Create test branch
git checkout -b test/secret-scanning

# 2. Add file with fake AWS key (clearly marked as test)
cat > test-secret.txt << 'EOF'
# TEST FILE - Intentional secret for testing Push Protection
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
EOF

# 3. Try to commit and push
git add test-secret.txt
git commit -m "test: verify push protection blocks secrets"
git push origin test/secret-scanning

# Expected: Push rejected by GitHub with message:
# "Push rejected by secret scanning. Resolve the secret and re-push your changes."
```

### Verify Results

✅ **Expected behavior:**
- Push blocked by GitHub
- Error message mentions secret scanning
- Secret never reaches repository
- Local commits are NOT deleted

✅ **Cleanup after test:**
```bash
# Delete local test commit
git reset --hard HEAD~1

# Delete remote test branch
git push origin --delete test/secret-scanning

# Delete local branch
git branch -D test/secret-scanning
```

---

## Success Criteria

✅ Task 1 is complete when:

- [ ] Command executed: `gh repo edit --enable-secret-scanning --enable-secret-scanning-push-protection`
- [ ] GitHub Settings shows both features "✅ Enabled"
- [ ] Git history scan shows no existing secrets
- [ ] Documentation added to `docs/solo-dev-pull-request-review.md`
- [ ] (Optional) Push Protection tested and verified working
- [ ] No errors in `gh` command output

---

## Troubleshooting

### Issue: "Permission denied" when running `gh repo edit`

**Solution:** Verify GitHub CLI authentication
```bash
gh auth status
gh auth login  # Re-authenticate if needed
```

### Issue: "Repository not found" error

**Solution:** Verify you're in the correct directory
```bash
pwd  # Should be: /home/pluto-atom-4/Documents/stoke-full-stack/ng-graphql-playground
gh repo view  # Should work if authenticated
```

### Issue: Settings not updated after command

**Solution:** Give GitHub 30-60 seconds to propagate settings
```bash
sleep 30
gh repo view --json url,visibility  # Verify again
```

### Issue: Cannot push after Push Protection enabled

**Solution:** Remove the secret and re-commit
```bash
# Edit the file to remove secret
git add -A
git commit --amend --no-edit
git push origin your-branch
```

---

## GitHub CLI Reference

**Check if GitHub CLI is installed:**
```bash
gh --version
```

**Authenticate:**
```bash
gh auth login
```

**View current repository:**
```bash
gh repo view
```

**Edit repository settings:**
```bash
gh repo edit --help
```

**View all available flags:**
```bash
gh repo edit --help | grep "\-\-enable"
```

---

## Related Documentation

- **Issue #7:** Harden repository security settings
- **Phase 2 Plan:** `docs/implementation-planning/issue-7-phase-2-github-security-features.md`
- **GitHub Docs:** [Secret Scanning](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
- **GitHub CLI Docs:** [gh repo edit](https://cli.github.com/manual/gh_repo_edit)

---

## Timeline

| Step | Duration | Command |
|------|----------|---------|
| Enable Secret Scanning | 10 sec | `gh repo edit --enable-secret-scanning --enable-secret-scanning-push-protection` |
| Verify Settings | 10 sec | `gh repo view --json url,visibility` |
| Scan History | 30 sec | `git log -p --all` (search for patterns) |
| Update Docs | 5 min | Add section to solo-dev-pull-request-review.md |
| Test Push Protection | 3 min | Create test, verify blocked, cleanup |
| **Total** | **~9 minutes** | - |

---

**Last Updated:** 2026-05-20  
**Version:** 1.0  
**Status:** Ready for Implementation
