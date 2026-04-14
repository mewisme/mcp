import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

const pkgPath = fileURLToPath(new URL('./package.json', import.meta.url));
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };

export default defineConfig({
  entry: ['src/bootstrap/index.ts'],
  format: ['esm'],
  clean: true,
  dts: true,
  sourcemap: true,
  minify: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  define: {
    __MCP_PACKAGE_VERSION__: JSON.stringify(pkg.version),
  },
  // Bundle monorepo packages so a single npm artifact has no workspace:* deps at runtime.
  noExternal: ['@meewmeew/shared', '@meewmeew/builtin-plugins', '@meewmeew/plugin-sdk'],
});
