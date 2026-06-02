// frontend/vitest.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import angular from '@analogjs/vitest-angular';

export default defineConfig(() => ({
  plugins: [angular()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: ['default'],
  },
}));
