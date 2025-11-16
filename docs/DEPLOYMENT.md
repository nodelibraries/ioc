# Deployment Guide

This guide explains how to deploy the documentation to GitHub Pages.

## Prerequisites

1. GitHub repository with the code
2. GitHub Actions enabled (enabled by default)

## Automatic Deployment

The documentation is automatically deployed when you push to the `main` branch. The GitHub Actions workflow (`.github/workflows/docs.yml`) handles:

1. Building the documentation
2. Deploying to GitHub Pages

## Manual Deployment

If you need to deploy manually:

```bash
# Build the docs
npm run docs:build

# The built files will be in docs/.vitepress/dist
```

## Configuration

### Update Base Path

Edit `docs/.vitepress/config.ts` and update the `base` path to match your repository name:

```typescript
export default defineConfig({
  base: '/your-repo-name/', // Update this
  // ...
});
```

### Repository Settings

1. Go to your GitHub repository
2. Navigate to Settings > Pages
3. Source should be set to "GitHub Actions"

## Custom Domain

To use a custom domain:

1. Add a `CNAME` file to `docs/public/` with your domain
2. Configure DNS settings as per GitHub Pages documentation

## Troubleshooting

### Build Fails

- Check that all dependencies are installed: `npm install`
- Verify VitePress version compatibility
- Check GitHub Actions logs for errors

### Pages Not Updating

- Ensure the workflow completed successfully
- Check that the `base` path matches your repository name
- Clear browser cache

### 404 Errors

- Verify the `base` path in `config.ts`
- Check that all links use relative paths
- Ensure the build completed successfully
