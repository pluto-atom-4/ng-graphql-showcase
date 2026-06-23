# GitHub Secrets Setup for CI/CD

This guide explains how to configure GitHub Secrets for secure credential management in automated workflows.

## Required Secrets

The HTTP Client API Tests workflow requires the following GitHub Secrets:

| Secret Name       | Purpose                      | Example Value                                                         |
| ----------------- | ---------------------------- | --------------------------------------------------------------------- |
| `SQL_SA_PASSWORD` | SQL Server SA admin password | Complex password (min 8 chars, uppercase, lowercase, digits, special) |

## How to Create Secrets

### Via GitHub Web UI

1. Navigate to repository settings: `https://github.com/YOUR_ORG/YOUR_REPO/settings/secrets/actions`
2. Click **New repository secret**
3. Enter secret name (e.g., `SQL_SA_PASSWORD`)
4. Enter secret value
5. Click **Add secret**

### Via GitHub CLI

```bash
gh secret set SQL_SA_PASSWORD --body "YourComplexPassword123!"
```

## Security Best Practices

1. **Strong passwords**: Use 12+ characters with uppercase, lowercase, digits, and special characters
2. **Rotate regularly**: Change SQL SA password every 90 days
3. **Limit access**: Only GitHub Actions workflows can access secrets, not pull requests from forks
4. **Audit logs**: Review secret access in repository audit logs
5. **Never commit**: Secrets MUST NOT be hardcoded in source files

## Workflow Integration

The `http-client-tests.yml` workflow automatically references secrets:

```yaml
env:
  SA_PASSWORD: ${{ secrets.SQL_SA_PASSWORD }}
```

Secrets are masked in workflow logs (displayed as `***`).

## Troubleshooting

### "Secret not found" error

- Verify secret name matches exactly (case-sensitive)
- Confirm secret exists in repository settings
- Check workflow has access to secrets (not disabled for public repos)

### Workflow fails during database migration

- Verify SQL_SA_PASSWORD secret is set
- Confirm password meets SQL Server complexity requirements
- Check database connectivity with `sqlcmd` command manually

## Related Documentation

- [GitHub Secrets Docs](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub CLI Secret Commands](https://cli.github.com/manual/gh_secret)
- [SQL Server Password Policy](https://learn.microsoft.com/en-us/sql/relational-databases/security/password-policy)
