import * as path from 'path';

/**
 * Parses MCP_FS_ALLOWED_ROOTS (comma-separated absolute or relative paths).
 * When unset: in production returns an empty list; in non-production defaults to `process.cwd()`.
 * Legacy helper; built-in filesystem tools use system-directory blocking instead of this allowlist.
 */
export function parseMcpFsAllowedRoots(env: NodeJS.ProcessEnv): string[] {
  const raw = env['MCP_FS_ALLOWED_ROOTS'];
  if (raw !== undefined && raw.trim() !== '') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((p) => path.resolve(p));
  }
  const nodeEnv = env['NODE_ENV'] ?? 'development';
  if (nodeEnv === 'production') {
    return [];
  }
  return [path.resolve(process.cwd())];
}
