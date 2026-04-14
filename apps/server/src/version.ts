import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

declare const __MCP_PACKAGE_VERSION__: string | undefined;

/**
 * Published npm version of `@meewmeew/mcp` (from package.json).
 * In production builds, injected by tsup; in dev (`tsx`), resolved from disk.
 */
export function getServerVersion(): string {
  if (typeof __MCP_PACKAGE_VERSION__ === 'string' && __MCP_PACKAGE_VERSION__.length > 0) {
    return __MCP_PACKAGE_VERSION__;
  }

  const here = dirname(fileURLToPath(import.meta.url));
  for (const rel of ['../package.json', '../../package.json']) {
    try {
      const pkgPath = join(here, rel);
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version?: string; name?: string };
      if (pkg.name === '@meewmeew/mcp' && typeof pkg.version === 'string') {
        return pkg.version;
      }
    } catch {
      /* try next */
    }
  }

  return 'unknown';
}
