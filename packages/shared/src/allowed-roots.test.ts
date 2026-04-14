import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseMcpFsAllowedRoots } from './allowed-roots.js';

describe('parseMcpFsAllowedRoots', () => {
  const prev = { ...process.env };

  beforeEach(() => {
    delete process.env['MCP_FS_ALLOWED_ROOTS'];
    delete process.env['NODE_ENV'];
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it('parses comma-separated paths', () => {
    process.env['MCP_FS_ALLOWED_ROOTS'] = 'C:/proj/a,C:/proj/b';
    const roots = parseMcpFsAllowedRoots(process.env);
    expect(roots.length).toBe(2);
    expect(roots[0]).toContain('proj');
    expect(roots[1]).toContain('proj');
  });

  it('returns empty in production when unset', () => {
    process.env['NODE_ENV'] = 'production';
    expect(parseMcpFsAllowedRoots(process.env)).toEqual([]);
  });

  it('defaults to cwd in development when unset', () => {
    process.env['NODE_ENV'] = 'development';
    const roots = parseMcpFsAllowedRoots(process.env);
    expect(roots.length).toBe(1);
  });
});
