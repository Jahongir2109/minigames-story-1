/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { type ConfigEnv, defineConfig, type UserConfig } from 'vite';

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const isProduction: boolean = mode === 'production';

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('src', import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [fileURLToPath(new URL('src/styles', import.meta.url))],
        },
      },
    },
    build: {
      target: 'es2022',
      minify: isProduction,
      sourcemap: !isProduction,
    },
    test: {
      include: ['src/**/*.test.ts'],
      // Most of the app builds DOM nodes, so the tests run in a simulated browser.
      environment: 'happy-dom',
      setupFiles: ['src/test-utils/setup.ts'],
      restoreMocks: true,
      unstubGlobals: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        // Every application source file is measured, including the ones no test imports.
        include: ['src/**/*.ts'],
        exclude: [
          // The tests themselves.
          'src/**/*.test.ts',
          // Test helpers (fake API, fixtures) used only by the tests.
          'src/test-utils/**',
          // Bootstrap only: imports the global styles and calls mountApp().
          'src/main.ts',
          // Type declarations only, no runtime code.
          'src/shared/types/**',
          // Static data (footer, sort options, URLs) with no logic.
          'src/shared/constants/footer.ts',
          'src/shared/constants/library.ts',
          'src/shared/constants/links.ts',
        ],
      },
    },
  };
});
