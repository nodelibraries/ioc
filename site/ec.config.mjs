// Lives outside astro.config so Starlight's <Code> component can load it (twoslash plugin isn't JSON-serializable).
import { defineEcConfig } from '@astrojs/starlight/expressive-code';
import ecTwoSlash from 'expressive-code-twoslash';
import { fileURLToPath } from 'node:url';

const lib = fileURLToPath(new URL('../src/', import.meta.url));

export default defineEcConfig({
  themes: ['github-dark-default', 'github-light'],
  styleOverrides: {
    borderRadius: '12px',
    borderColor: 'var(--io-hairline)',
    codeFontFamily: "'Geist Mono Variable', ui-monospace, monospace",
    codeFontSize: '0.84rem',
    codeLineHeight: '1.7',
    codeBackground: 'var(--io-code-bg)',
    uiFontFamily: "'Geist Variable', ui-sans-serif, system-ui, sans-serif",
    frames: {
      shadowColor: 'transparent',
      editorTabBarBackground: 'var(--io-surface)',
      editorActiveTabBackground: 'var(--io-code-bg)',
      editorActiveTabIndicatorTopColor: 'transparent',
      editorActiveTabIndicatorBottomColor: 'var(--sl-color-accent)',
      editorTabBarBorderBottomColor: 'var(--io-hairline)',
      terminalTitlebarBackground: 'var(--io-surface)',
      terminalBackground: 'var(--io-code-bg)',
      frameBoxShadowCssValue: 'none',
    },
  },
  plugins: [
    ecTwoSlash({
      // Snippets import '@ylcnfrht/ioc'; resolve it to the library's source.
      twoslashOptions: {
        // expressive-code-twoslash 0.6.1 builds a fresh twoslasher per block; a shared env cache stops the build OOM.
        cache: new Map(),
        compilerOptions: {
          module: 99, // ESNext
          moduleResolution: 100, // Bundler
          target: 99, // ESNext (await using, Symbol.asyncDispose)
          lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
          strict: true,
          allowImportingTsExtensions: true,
          noEmit: true,
          skipLibCheck: true,
          paths: { '@ylcnfrht/ioc': [`${lib}index.ts`] },
        },
      },
    }),
  ],
});
