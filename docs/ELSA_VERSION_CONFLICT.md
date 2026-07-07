# Elsa Version Conflict: GitHub Releases vs NuGet

**Status:** ⏳ AWAITING NuGet Publication  
**Current:** v3.5.3 (NuGet) vs v3.7.1 (GitHub)  
**Issue:** GitHub releases don't guarantee NuGet availability

## Problem

Elsa v3 releases on GitHub don't automatically publish to NuGet.org. This creates a mismatch:

| Source              | Latest Version | Has FluentAPI | Has Async Bookmarks |
| ------------------- | -------------- | ------------- | ------------------- |
| **NuGet.org**       | 3.5.3 ❌       | No            | No                  |
| **GitHub Releases** | 3.7.1 ✅       | Yes           | Yes                 |

## NuGet Availability

```
✅ 3.5.3 - Latest on NuGet.org
❌ 3.6.0, 3.6.3, 3.7.0, 3.7.1 - Not on NuGet.org despite GitHub releases
```

**Error when trying to install v3.6+:**

```
error NU1102: Unable to find package Elsa.EntityFrameworkCore.SqlServer with version (>= 3.6.0)
Found 57 version(s) in nuget.org [ Nearest version: 3.5.3 ]
```

## Why This Matters

Phase 3 implementation requires APIs only in v3.6+:

- `WorkflowBase` abstract class
- `protected override void Build(IWorkflowBuilder)` method
- Async bookmarks for `AwaitTestCompletionActivity`

These APIs don't exist in v3.5.3 on NuGet.

## Solutions

### Option A: Wait for NuGet Publication (Recommended)

Monitor: https://www.nuget.org/packages/Elsa/

When v3.6+ appears on NuGet:

```xml
<PackageReference Include="Elsa" Version="3.6.0" />
<PackageReference Include="Elsa.EntityFrameworkCore.SqlServer" Version="3.6.0" />
```

Then implement Phase 3-6 per spec.

### Option B: Build from GitHub Source (Advanced)

Clone Elsa repo and build locally:

```bash
git clone https://github.com/elsa-workflows/elsa-core.git
cd elsa-core
dotnet build
```

Add local package source to NuGet.config:

```xml
<add key="local-elsa" value="/path/to/elsa-core/bin" />
```

### Option C: Use GitHub Package Registry

Elsa publishes to GitHub Packages (https://github.com/orgs/elsa-workflows/packages):

```xml
<PackageReference Include="Elsa" Version="3.7.1" />
```

Requires authentication:

```bash
dotnet nuget add source "https://nuget.pkg.github.com/elsa-workflows/index.json" \
  --name "GitHub" \
  --username USERNAME \
  --password GITHUB_TOKEN \
  --store-password-in-clear-text
```

## Current Workaround

Stay on v3.5.3 (NuGet available) with Phase 1-2 implementation:

- ✅ Activities created & DI registered
- ⏳ Phase 3-6 blocked until v3.6+ on NuGet

## Timeline

1. **Now:** v3.5.3 on NuGet, v3.7.1 on GitHub
2. **Action:** Monitor NuGet for v3.6+ release
3. **When v3.6+ on NuGet:** Implement Phase 3-6
4. **Unblock:** GitHub issues #169-172

## References

- Elsa NuGet: https://www.nuget.org/packages/Elsa/
- Elsa GitHub: https://github.com/elsa-workflows/elsa-core
- GitHub Packages: https://github.com/orgs/elsa-workflows/packages

---

**Action:** Check NuGet weekly. When v3.6+ published, update csproj and implement Phase 3.

See: `PHASE_3_BLOCKER.md` for implementation details.
