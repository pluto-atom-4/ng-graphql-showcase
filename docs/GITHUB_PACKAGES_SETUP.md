# GitHub Packages Setup for Elsa v3.7.1

**Status:** ⏳ Requires GitHub Token Authentication  
**Package:** Elsa v3.7.1 from GitHub Packages  
**Alternative:** See `ELSA_VERSION_CONFLICT.md` for other options

## Quick Setup (5 minutes)

### 1. Create GitHub Personal Access Token

Visit: https://github.com/settings/tokens/new

Create token with:

- Scopes: `read:packages`
- Name: `ELSA_NUGET_TOKEN`
- Expiration: 90 days

Copy token (you'll need it in step 2).

### 2. Add GitHub Packages Source

Run this command in `/backend` directory:

```bash
dotnet nuget add source "https://nuget.pkg.github.com/elsa-workflows/index.json" \
  --name "github" \
  --username <YOUR_GITHUB_USERNAME> \
  --password <YOUR_GITHUB_TOKEN> \
  --store-password-in-clear-text
```

Replace:

- `<YOUR_GITHUB_USERNAME>` - Your GitHub username
- `<YOUR_GITHUB_TOKEN>` - Token from step 1

### 3. Test Restore

```bash
dotnet restore src/FactoryApp.Workflows
```

Should succeed without errors.

### 4. Build & Verify

```bash
dotnet build ./src/FactoryApp.WebApi
```

Should compile. Then implement Phase 3.

## Cleanup (When Done)

To remove GitHub Packages source:

```bash
dotnet nuget remove source "github"
```

## Troubleshooting

### Token Invalid

```
error NU1102: Unable to find package...Found 0 version(s) in github
```

Check:

- Token has `read:packages` scope
- Token hasn't expired
- Username/token URL correct

### Permission Denied

```
Response status code does not indicate success: 403 (Forbidden)
```

Token needs `read:packages` scope. Generate new token.

### NuGet.config Issue

If credentials stored wrong:

```bash
rm ~/.nuget/NuGet/NuGet.config
dotnet nuget add source ... (repeat step 2)
```

## What Gets Unlocked

With v3.7.1 installed:

- ✅ WorkflowBase fluent API
- ✅ Async bookmarks
- ✅ Phase 3-6 implementation available

## Secure Practices

Credentials stored in:

- Linux/Mac: `~/.config/NuGet/NuGet.config`
- Windows: `%APPDATA%\NuGet\NuGet.config`

**Never commit credentials to git.** Add to `.gitignore`:

```
NuGet.config
~/.nuget/
```

## References

- GitHub Packages: https://docs.github.com/en/packages/learn-github-packages/about-github-packages
- NuGet Docs: https://learn.microsoft.com/en-us/nuget/reference/nuget-client-tools-cli-reference

---

**Next:** After setup, proceed to implement Phase 3 per `gh-issue-draft-3.md`.

See: `ELSA_VERSION_CONFLICT.md` for context on why this is needed.
