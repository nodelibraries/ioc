// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import preact from '@astrojs/preact';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';
import starlightLinksValidator from 'starlight-links-validator';
import { fileURLToPath } from 'node:url';

const lib = fileURLToPath(new URL('../src/', import.meta.url));

// Parallel builds need separate output/cache dirs; SKIP_TYPEDOC speeds up content checks.
const skipTypeDoc = process.env.SKIP_TYPEDOC === '1';

export default defineConfig({
  devToolbar: { enabled: false },
  site: 'https://ioc.ferhatyalcin.dev',
  outDir: process.env.ASTRO_OUT_DIR ?? './dist',
  cacheDir: process.env.ASTRO_CACHE_DIR ?? './node_modules/.astro',
  vite: {
    // Interactive components import the library straight from source, so every demo runs the current code.
    resolve: { alias: [{ find: /^@ylcnfrht\/ioc$/, replacement: `${lib}index.ts` }] },
    server: { fs: { allow: ['..'] } },
    // The container's messages and the demos print class names; minification must not rename classes.
    build: { rolldownOptions: { output: { keepNames: true } } },
    // ec.config.mjs pulls twoslash + the TypeScript compiler into SSR; bundling them exhausts the heap.
    ssr: { external: ['typescript', 'twoslash', 'expressive-code-twoslash', '@typescript/vfs'] },
  },
  integrations: [
    preact(),
    starlight({
      title: '@ylcnfrht/ioc',
      description: 'A type-safe IoC container for TypeScript, modeled on .NET ServiceCollection: lifetimes, scopes, keyed services, circular dependencies, typed errors. Zero dependencies.',
      logo: { src: './src/assets/logo.svg' },
      favicon: '/favicon.svg',
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://ioc.ferhatyalcin.dev/og.png' } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://ioc.ferhatyalcin.dev/og.png' } },
      ],
      customCss: ['@fontsource-variable/geist', '@fontsource-variable/geist-mono', './src/styles/theme.css'],
      components: { Header: './src/components/overrides/Header.astro' },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/ylcnfrht/ioc' },
        { icon: 'seti:npm', label: 'npm', href: 'https://www.npmjs.com/package/@ylcnfrht/ioc' },
      ],
      lastUpdated: false,
      pagination: true,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      plugins: [
        ...(skipTypeDoc ? [] : [starlightTypeDoc({
          entryPoints: ['../src/index.ts'],
          tsconfig: './typedoc.tsconfig.json',
          output: 'api',
          sidebar: { label: 'API', collapsed: true },
          typeDoc: { excludeInternal: true, excludePrivate: true, readme: 'none', entryFileName: 'overview' },
        })]),
        ...(process.env.SKIP_LINKS === '1' ? [] : [starlightLinksValidator({ errorOnLocalLinks: false, exclude: ['/playground', '/playground/', ...(skipTypeDoc ? ['/api/**'] : [])] })]),
      ],
      sidebar: [
        { label: 'Start here', items: [{ autogenerate: { directory: 'start' } }] },
        { label: 'Concepts', items: [{ autogenerate: { directory: 'concepts' } }] },
        { label: 'Guides & recipes', items: [{ autogenerate: { directory: 'guides' } }] },
        { label: 'Migrating', collapsed: true, items: [{ autogenerate: { directory: 'migration' } }] },
        { label: 'Reference', items: [{ autogenerate: { directory: 'reference' } }] },
        ...(skipTypeDoc ? [] : [typeDocSidebarGroup]),
      ],
    }),
  ],
});
