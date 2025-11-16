# Documentation

This directory contains the documentation for `@nodelibraries/ioc`, built with [VitePress](https://vitepress.dev/).

## Development

```bash
npm run docs:dev
```

This will start a local development server at `http://localhost:5173`.

## Build

```bash
npm run docs:build
```

This will generate static files in `.vitepress/dist`.

## Preview

```bash
npm run docs:preview
```

This will preview the production build locally.

## Deployment

The documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` branch. The deployment is handled by the GitHub Actions workflow in `.github/workflows/docs.yml`.

The documentation will be available at:
`https://nodelibraries.github.io/ioc/`

## Structure

- `guide/` - User guides and tutorials
- `api/` - API reference documentation
- `examples/` - Code examples and use cases
- `.vitepress/` - VitePress configuration

## Configuration

Update the `base` path in `.vitepress/config.ts` to match your repository name:

```typescript
base: '/ioc/', // Change to match your repo name
```
