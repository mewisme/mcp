import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/bootstrap/index.ts'],
  format: ['esm'],
  clean: true,
  sourcemap: true,
  minify: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Bundle monorepo packages so a single npm artifact has no workspace:* deps at runtime.
  noExternal: ['@meewmeew/shared', '@meewmeew/builtin-plugins', '@meewmeew/plugin-sdk'],
});
