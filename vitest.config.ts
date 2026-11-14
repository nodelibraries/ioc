import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@ylcnfrht/ioc': new URL('./src/index.ts', import.meta.url).pathname } },
  test: {
    globals: true,
    include: ['test/**/*.test.ts'],
    typecheck: { enabled: true, include: ['test/**/*.test-d.ts'] },
    coverage: {
      include: ['src/**'],
      thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 },
    },
  },
});
