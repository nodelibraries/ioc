# GitHub Actions Workflows

## NPM Publish Workflow

This workflow automatically runs when code is pushed to the `main` branch:

1. ✅ Runs tests
2. ✅ Builds the code
3. ✅ Checks version:
   - If `package.json` version matches npm version → bumps patch version
   - If different → uses current version
4. ✅ Publishes to npm
5. ✅ Pushes version bump commit with `[skip ci]` (prevents infinite loop)

### Setup

**Add NPM_TOKEN Secret to GitHub:**

1. Log in to npm.com
2. Profile → Access Tokens → Generate New Token (Classic)
3. Token type: **Automation** (required for publishing)
4. Copy the token
5. GitHub Repository → Settings → Secrets and variables → Actions
6. "New repository secret" → Name: `NPM_TOKEN`, Value: (paste token)

### How It Works

- **Normal commit:** Push to main → Test → Build → Version check → Publish
- **Version bump commit:** Commits with `[skip ci]` don't trigger workflow (prevents infinite loop)
- **Docs/Examples changes:** Workflow doesn't trigger (only runs on code changes)

### Manual Version Bump

If you want to manually bump the version:

```bash
npm version patch  # or minor, major
git push origin main
```

In this case, the workflow will publish the current version to npm.
