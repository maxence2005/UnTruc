// Vitest lit le bloc `test` ; il ne lance que les tests unitaires (règles de `src/core/`, sans navigateur).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
