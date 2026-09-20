import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
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
  };
});
