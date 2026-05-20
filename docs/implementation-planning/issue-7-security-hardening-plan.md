# Issue #7: Harden Repository Security Settings - Implementation Plan

## Executive Summary

This document outlines the comprehensive security hardening plan for ng-graphql-playground repository. The goal is to establish industry-standard security controls for a **solo developer workflow** managing manufacturing workflows and customer data.

**Priority:** High  
**Current Status:** Partial branch protection exists; remaining items need implementation  
**Estimated Effort:** 3-5 hours (initial setup + configuration)  
**Ongoing:** 1-2 hours/week (monitoring + maintenance)

---

## Current State Assessment

### ✅ Already Configured

**Branch Protection (main branch):**
- ✅ Requires 1 approving review (via AI Code Review automation)
- ✅ Stale reviews auto-dismissed on new commits
- ✅ Force pushes disabled
- ✅ Branch deletion disabled

**Repository Files:**
- ✅ `.gitignore` file configured with proper exclusions
- ✅ `.env.local.example` template created
- ✅ `appsettings.Development.json` with local configuration
- ✅ `.git` repository initialized

**GitHub Actions:**
- ✅ `ai-code-review.yml` workflow implemented (auto-approves solo developer PRs)

### ❌ Missing/Not Configured

**Branch Protection Gaps (assess for solo developer need):**
- ⚠️ `require_code_owner_reviews`: Not needed for solo developer (self-approves)
- ❌ `require_last_push_approval`: false (optional for solo)
- ❌ `required_signatures`: false (recommended for integrity)
- ❌ `enforce_admins`: false (recommended best practice)
- ❌ `required_linear_history`: false (optional, prefer rebase)

**GitHub Security Features:**
- ❌ Secret Scanning: Not enabled (HIGH PRIORITY)
- ❌ Dependabot: Not configured (HIGH PRIORITY)
- ❌ Code Scanning (CodeQL): Not enabled (MEDIUM PRIORITY)
- ❌ Security Policy (SECURITY.md): Not documented (MEDIUM PRIORITY)
- ❌ Contributor Guidelines (CONTRIBUTING.md): Not created (LOW - solo dev only)

**GitHub Actions Security:**
- ⚠️ Actions not pinned to commit SHAs (uses semantic versions like @v7)
- ⚠️ BOT_TOKEN secret needs verification/setup

---

## Security Considerations for Solo Developer

### AI Code Review Auto-Approval ✅
**Current state:** `ai-code-review.yml` auto-approves PRs from pluto-atom-4

**Implication:**
- No external review needed (solo developer)
- Code owner review requirement bypassed safely
- Self-approval is acceptable for solo developer workflow
- **BUT:** Auto-approval does NOT bypass CI/CD checks (still required)

### Recommendation: Minimal Friction Approach
For a solo developer, prioritize:
1. **Secret protection** (prevent accidental leaks)
2. **Dependency security** (catch vulnerabilities early)
3. **Code quality scanning** (catch issues automatically)
4. **Commit integrity** (optional; not enforce signed commits if inconvenient)

---

## Implementation Plan

### Phase 1: Documentation & Foundation (Hours 0-1)
**Goal:** Establish baseline security governance documents

#### 1.1 Create SECURITY.md
**File:** `SECURITY.md`  
**Purpose:** Define vulnerability reporting and security practices

**Content:**
```markdown
# Security Policy

## Reporting Security Vulnerabilities

This is a solo developer project. Please report security vulnerabilities by email 
to [security contact] rather than opening a public GitHub issue, to avoid disclosing 
the vulnerability before a fix is available.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅        |

## Security Practices

- ✅ Secret scanning enabled with push protection
- ✅ Pull requests require auto-approval from solo developer
- ✅ All CI checks must pass before merge
- ✅ Code scanning via CodeQL on all PRs
- ✅ Dependabot monitors dependencies for vulnerabilities
- ✅ No external commits permitted to main branch

## Development Security Guidelines

- Never commit secrets (API keys, passwords, tokens)
- Use `.env.local.example` for environment variable templates
- Enable commit signing for critical commits (optional but recommended)
- Review Dependabot security updates promptly
- Report suspicious activity in GitHub Actions logs
```

#### 1.2 Create or Update CODEOWNERS File (Optional)
**File:** `CODEOWNERS`  

**For solo developer, this is optional** but recommended for documentation:
```
# Default ownership (documentation only for solo dev)
* @pluto-atom-4
```

#### 1.3 Create Minimal CONTRIBUTING.md
**File:** `CONTRIBUTING.md`  
**Purpose:** Guide for future contributors or collaborators

**Content:**
```markdown
# Contributing Guidelines

This is a **solo developer** project. External contributions require approval.

## Development Setup

See [docs/SETUP.md](docs/SETUP.md) for local development environment.

## Security

- Do not commit secrets (API keys, passwords, credentials)
- All security vulnerabilities must be reported privately
- See [SECURITY.md](SECURITY.md) for reporting process

## Pull Request Process

1. Create a feature branch
2. Push changes and create a PR
3. PR is auto-approved by solo developer workflow
4. All CI checks must pass
5. Manual merge via GitHub UI

## Code Quality

- TypeScript for frontend (strict mode enabled)
- C# for backend (.NET 8+)
- All tests must pass
- No hardcoded secrets or credentials
```

---

### Phase 2: GitHub Security Features (High Priority) (Hours 1-3)
**Goal:** Enable GitHub's native security scanning and dependency management

#### 2.1 Enable Secret Scanning ⭐ HIGH PRIORITY
**Navigate:** Settings → Code security and analysis

**Actions:**
- [ ] Enable "Secret scanning" (free for public repos)
- [ ] Enable "Push protection" (prevents commits with detected secrets)
- [ ] Configure alerts (email notifications recommended)

**Expected result:** GitHub blocks suspicious patterns (API keys, tokens, credentials) before commit

**Importance for solo dev:** Prevents accidental credential leaks that could compromise manufacturing data

#### 2.2 Enable Dependabot ⭐ HIGH PRIORITY
**File:** `.github/dependabot.yml`  
**Purpose:** Automatically monitor and update dependencies

**Create file with:**
```yaml
version: 2
updates:
  # Frontend npm dependencies
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
    open-pull-requests-limit: 5
    reviewers:
      - "pluto-atom-4"
    allow:
      - dependency-type: "all"

  # Backend NuGet packages
  - package-ecosystem: "nuget"
    directory: "/backend/src"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:30"
    open-pull-requests-limit: 5
    reviewers:
      - "pluto-atom-4"
    allow:
      - dependency-type: "all"

  # GitHub Actions (keep tooling current)
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "04:00"
    reviewers:
      - "pluto-atom-4"
```

**GitHub UI Actions:**
1. Settings → Code security and analysis
2. [ ] Enable "Dependabot alerts"
3. [ ] Enable "Dependabot security updates"
4. [ ] Enable "Dependabot version updates"

**Workflow for solo dev:**
- Dependabot creates PRs weekly
- Each PR auto-approved by AI Code Review (if compatible)
- Merge when CI passes and no breaking changes

#### 2.3 Enable CodeQL Code Scanning (Medium Priority)
**File:** `.github/workflows/codeql-analysis.yml`

**Create workflow:**
```yaml
name: CodeQL Analysis

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # Weekly Sunday 00:00 UTC

jobs:
  analyze:
    name: Analyze Code
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: ['csharp', 'javascript']

    steps:
      - name: Checkout Repository
        uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332

      - name: Initialize CodeQL
        uses: github/codeql-action/init@eb055d739abdc2e8de2e5f4ba1a8b246dbb29c5d
        with:
          languages: ${{ matrix.language }}

      - name: Autobuild
        uses: github/codeql-action/autobuild@eb055d739abdc2e8de2e5f4ba1a8b246dbb29c5d

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@eb055d739abdc2e8de2e5f4ba1a8b246dbb29c5d
        with:
          category: "/language:${{ matrix.language }}"
```

**GitHub UI Actions:**
1. Settings → Code security and analysis
2. [ ] Enable "CodeQL analysis"
3. Workflow will appear in `.github/workflows/`

**For solo dev:** Automatically catches code quality issues; failures prevent merge

---

### Phase 3: Branch Protection Adjustment (Hours 3-4)
**Goal:** Fine-tune branch protection for solo developer workflow

#### 3.1 Review Current Branch Protection Rule
**Current settings (from API):**
```
✅ Requires 1 approving review (via AI Code Review)
✅ Stale reviews dismissed on new commits
✅ Force pushes disabled
✅ Branch deletion disabled

❌ Code owner reviews: false (not needed for solo)
❌ Signed commits: false (optional)
❌ Enforce on admins: false (optional for solo)
```

#### 3.2 Optional Enhancements for Solo Developer
**Decide per preference:**

**Option 1: Minimal (Recommended for Solo Dev)**
- Keep current settings
- Focus on secret scanning + Dependabot
- Speed over strictness
- Cost: Lower friction

**Option 2: Moderate**
- Add required status checks (CodeQL + build)
- Require linear history (clean git)
- Cost: Minor friction

**Option 3: Maximum**
- Add signed commits requirement
- Enable all optional protections
- Cost: Higher friction (GPG key management)

#### 3.3 Add Required Status Checks (Recommended)
**If enabling CodeQL:**
1. Settings → Branches → main protection rule
2. Scroll to "Status checks that are required to pass before merging"
3. [ ] Enable "Require branches to be up to date before merging"
4. [ ] Add check: "CodeQL / analyze" (or similar)
5. [ ] Add check: any build workflow checks

**Effect:** Prevents merge if code scanning fails

---

### Phase 4: GitHub Actions Security (Optional but Recommended) (Hours 4-4.5)
**Goal:** Pin actions and secure token usage

#### 4.1 Pin GitHub Actions to Commit SHAs (OPTIONAL)
**Note:** This adds security but requires maintenance with Dependabot

**Current issue:** Actions use semantic versions (@v7) which auto-update

**Update files:**
- `.github/workflows/ai-code-review.yml`
- `.github/workflows/codeql-analysis.yml`

**Before:**
```yaml
- uses: actions/checkout@v4
- uses: actions/github-script@v7
```

**After (if enabling):**
```yaml
- uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332
- uses: actions/github-script@e3f90e0f73c34f6a98c0aed66f41a1c0c8e2a7f5
```

**Recommendation:** Skip for solo dev; Dependabot will handle updates

#### 4.2 Verify BOT_TOKEN Permissions (Required)
**Needed for:** AI Code Review workflow

**Steps:**
1. Verify token has these scopes:
   - `repo` (full repository access)
   - `workflow` (GitHub Actions)
   - `pull-requests:write` (create reviews)

2. Verify configured in repository secrets:
   - Settings → Secrets and variables → Actions
   - Name: `BOT_TOKEN`
   - ✅ Token is set

3. Document token expiration:
   - If classic token: 90-day expiration
   - Set reminder to renew before expiration

---

### Phase 5: Documentation & Testing (Hours 4.5-5)
**Goal:** Document security practices and verify everything works

#### 5.1 Update README.md
**Add security section:**
```markdown
## Security

This repository implements the following security controls:

- ✅ **Secret Scanning**: Push protection enabled (prevents accidental credential leaks)
- ✅ **Dependency Monitoring**: Dependabot checks for vulnerabilities weekly
- ✅ **Code Scanning**: CodeQL analysis on all PRs (TypeScript & C#)
- ✅ **Branch Protection**: Auto-approval via AI Code Review workflow + CI requirements
- ✅ **PR Review Automation**: Solo developer PRs auto-approved

### Reporting Security Vulnerabilities

See [SECURITY.md](SECURITY.md) for vulnerability disclosure process.
```

#### 5.2 Create docs/SECURITY-CHECKLIST.md
**Purpose:** Developer checklist for security practices

**Content:**
```markdown
# Security Checklist for Developers

## Before Committing
- [ ] No hardcoded passwords, API keys, or tokens
- [ ] Secrets should be in `.env.local` (not committed)
- [ ] No sensitive data in logs
- [ ] No credentials in environment variable examples

## Creating a PR
- [ ] PR title is descriptive
- [ ] Code changes reviewed manually
- [ ] No unexpected files in commit
- [ ] Tests pass locally

## After PR Creation
- [ ] Secret scanning passes (no push protection blocks)
- [ ] CodeQL analysis completes (no critical findings)
- [ ] All CI checks pass
- [ ] Manual merge via GitHub UI

## Handling Dependabot PRs
- [ ] Review changes in Dependabot PR
- [ ] Verify CI passes
- [ ] Merge if patch/minor, review carefully if major
```

#### 5.3 Test Everything
**Verification checklist:**
- [ ] Secret scanning blocks test commit with fake secret
- [ ] CodeQL analysis runs on PR (check Actions tab)
- [ ] Dependabot creates PRs for dependencies
- [ ] AI Code Review auto-approves solo dev PRs
- [ ] Branch protection prevents direct push to main
- [ ] All CI checks pass on a test PR

---

## Solo Developer Security Priorities

### ✅ Required (High Security Impact, Low Friction)
1. Secret Scanning + Push Protection
2. Dependabot for dependency vulnerabilities
3. CodeQL code analysis
4. BOT_TOKEN for auto-approval workflow

### ✅ Recommended (Good Security, Minimal Friction)
1. SECURITY.md documentation
2. Security checklist for contributors
3. Required status checks (CodeQL + build)

### ⚠️ Optional (High Security, More Friction)
1. Signed commits (GPG key management)
2. Code owner reviews (not applicable to solo)
3. Enforce admin approval (unnecessary for solo)

---

## Acceptance Criteria (Solo Developer Edition)

### ✅ Security Features Enabled
- [ ] Secret scanning active with push protection
- [ ] Dependabot configured (npm, nuget, github-actions)
- [ ] CodeQL analysis enabled and passing
- [ ] BOT_TOKEN configured and verified

### ✅ Documentation Complete
- [ ] SECURITY.md created
- [ ] CONTRIBUTING.md updated or created
- [ ] README.md includes security section
- [ ] docs/SECURITY-CHECKLIST.md created

### ✅ Branch Protection Appropriate for Solo Dev
- [ ] AI Code Review auto-approval working
- [ ] Required status checks configured
- [ ] Force push/deletion prevention in place

### ✅ Testing & Verification
- [ ] No active secret scanning alerts
- [ ] CodeQL passes with acceptable false positives
- [ ] Dependabot successfully scans dependencies
- [ ] All security features integrated into workflow

---

## Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| 1: Foundation | 1 hour | SECURITY.md, CONTRIBUTING.md, minimal CODEOWNERS |
| 2: GitHub Security | 2 hours | Secret scanning, Dependabot, CodeQL |
| 3: Branch Protection | 1 hour | Status checks, optional enhancements |
| 4: Actions Security | 0.5 hours | BOT_TOKEN verification |
| 5: Documentation | 0.5 hours | README, SECURITY-CHECKLIST, testing |
| **Total** | **5 hours** | **Complete hardening** |

---

## Implementation Sequence (Recommended)

1. **Create SECURITY.md** (5 min)
2. **Update CONTRIBUTING.md** (5 min)
3. **Enable secret scanning** (5 min)
4. **Create Dependabot config** (10 min)
5. **Create CodeQL workflow** (10 min)
6. **Add status checks to branch protection** (5 min)
7. **Update README.md** (5 min)
8. **Create SECURITY-CHECKLIST.md** (10 min)
9. **Verify BOT_TOKEN configured** (5 min)
10. **Test everything** (15 min)

**Total setup time: ~75 minutes**

---

## Post-Implementation Maintenance

### Weekly (15 minutes)
- [ ] Review Dependabot PRs
- [ ] Merge non-critical security updates
- [ ] Check for CodeQL alerts

### Monthly (30 minutes)
- [ ] Audit GitHub Actions logs
- [ ] Review security-related issues
- [ ] Update documentation if needed
- [ ] Verify BOT_TOKEN not expired

### Quarterly (30 minutes)
- [ ] Review and refresh SECURITY.md
- [ ] Audit repository access
- [ ] Check GitHub security recommendations
- [ ] Renew BOT_TOKEN if using classic token

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Secrets already in commit history | HIGH | Run scan before push protection; clean history |
| Dependabot creates too many PRs | MEDIUM | Limit to 5 open; focus on security updates first |
| CodeQL false positives | LOW | Configure severity; document expected findings |
| Secret scanning blocks legitimate commits | LOW | Whitelist known patterns; rare with good practices |

---

## Related Issues & PRs

- PR #11: Docker setup (uses environment variables)
- PR #8: AI Code Review (uses BOT_TOKEN)
- Issue #10: Docker compose (manages secrets in .env)

---

## Security Best Practices for Solo Developer

1. **Never commit secrets** — Use .env files, environment variables
2. **Trust but verify** — Check Dependabot updates before merging
3. **Automate what you can** — Secret scanning + CodeQL catch issues early
4. **Keep current** — Update dependencies regularly via Dependabot
5. **Document security** — SECURITY.md and CONTRIBUTING.md guide future reviewers
6. **Use CI/CD as safety net** — All checks must pass before merge

---

## References

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Analysis](https://docs.github.com/en/code-security/code-scanning)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides)

---

## Sign-Off

**Created:** 2026-05-20  
**Plan Version:** 1.1 (Solo Developer Edition)  
**Issue:** #7 - Harden repository security settings  
**Status:** Ready for implementation  
**Owner:** pluto-atom-4  
**Last Updated:** 2026-05-20

**Solo Developer Specific Notes:**
- Prioritizes high-security-impact, low-friction items
- Code owner reviews not required (self-approval via AI Code Review)
- Signed commits optional (for convenience)
- Minimal process overhead for solo developer workflow
