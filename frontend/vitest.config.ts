// frontend/vitest.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => ({
  plugins: [
    angular(),
    tailwindcss(),
  ],
  resolve: {
    // Replace apollo-angular with mock to avoid EISDIR ESM resolution issue
    alias: {
      'apollo-angular': new URL('./src/apollo.mock.ts', import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/app/**/*.ts'],
      exclude: [
        'src/app/**/*.spec.ts',
        'src/app/**/index.ts',
        'src/app/api/generated/**',
      ],
    },
  },
}));
