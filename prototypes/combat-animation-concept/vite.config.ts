// PROTOTYPE - NOT FOR PRODUCTION
// Question: Quelle technique d'animation rend des combats auto-battler 2D beaux et variés sans dessiner chaque animation : ragdoll physique, squelette modulaire animé par code, ou combo des deux ?
// Date: 2026-11-09

import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        piste1: resolve(__dirname, 'piste-1.html'),
        piste2: resolve(__dirname, 'piste-2.html'),
        piste4: resolve(__dirname, 'piste-4.html'),
        piste5: resolve(__dirname, 'piste-5.html'),
      },
    },
    chunkSizeWarningLimit: 2000,
  },
});
