import 'dotenv/config';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

/** Directory of the `@meewmeew/mcp` package (`apps/server`), works for both `src/` and `dist/` layouts. */
const serverPackageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function resolveDataDir(): string {
  const raw = process.env['MCP_DATA_DIR'];
  if (raw !== undefined && raw.trim() !== '') {
    return path.resolve(raw.trim());
  }
  return path.join(os.homedir(), '.mcp-management');
}

export const config = {
  env: process.env['NODE_ENV'] ?? 'development',
  logLevel: process.env['LOG_LEVEL'] ?? 'info',
  /** Resolved directory for JSON persistence (`store.json`). Override with MCP_DATA_DIR. */
  persistence: {
    dataDir: resolveDataDir(),
    /** In-memory stores only; set automatically when NODE_ENV is `test`, or force with MCP_IN_MEMORY_PERSISTENCE=true. */
    useInMemory:
      process.env['MCP_IN_MEMORY_PERSISTENCE'] === 'true' || process.env['NODE_ENV'] === 'test',
  },
  server: {
    port: parseInt(process.env['PORT'] ?? '3000', 10),
  },
  /** Absolute path to the server package root (for diagnostics / future use). */
  serverPackageRoot,
  /** When false, path/package/bundle loaders reject loads unless explicitly enabled. */
  allowExternalPlugins: process.env['MCP_ALLOW_EXTERNAL_PLUGINS'] === 'true',
};
