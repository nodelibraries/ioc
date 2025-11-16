# Documentation Site

The documentation site is built with [VitePress](https://vitepress.dev/) and deployed to GitHub Pages.

## Local Development

```bash
npm run docs:dev
```

Visit `http://localhost:5173` to view the documentation.

## Build

```bash
npm run docs:build
```

Builds the documentation to `docs/.vitepress/dist`.

## Preview Production Build

```bash
npm run docs:preview
```

## Deployment

The documentation is automatically deployed to GitHub Pages via GitHub Actions when you push to the `main` branch.

**Documentation URL:** `https://nodelibraries.github.io/ioc/`

## Configuration

### Update Repository Name

If your repository name is different, update the `base` path in `docs/.vitepress/config.ts`:

```typescript
base: '/ioc/', // Change this
```

### Update GitHub Links

Update GitHub links in `docs/.vitepress/config.ts` and `docs/index.md`:

```typescript
{ text: 'GitHub', link: 'https://github.com/nodelibraries/ioc' },
```

## Structure

```
docs/
├── .vitepress/
│   ├── config.ts           # VitePress configuration
│   └── theme/              # Custom theme
├── guide/                  # User guides
├── api/                    # API reference
├── examples/               # Code examples
└── index.md                # Home page
```

## Adding New Pages

1. Create a new `.md` file in the appropriate directory
2. Add it to the sidebar in `docs/.vitepress/config.ts`
3. Use relative links for internal navigation

## Troubleshooting

### Build Fails

- Ensure all dependencies are installed: `cd docs && npm install`
- Check for dead links in the build output
- Verify all referenced files exist

### Pages Not Updating

- Clear browser cache
- Check GitHub Actions workflow status
- Verify the `base` path matches your repository name
