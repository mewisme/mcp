import { mkdtempSync } from 'fs';
import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as os from 'os';
import { FileSystemPathGuard } from './path-guard.js';

describe('FileSystemPathGuard', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'mcp-fs-allowed-'));
  const outside = mkdtempSync(path.join(os.tmpdir(), 'mcp-fs-other-'));
  const guard = new FileSystemPathGuard();

  it('allows paths under an arbitrary base outside system dirs', async () => {
    const p = await guard.validatePath(root, 'src/index.ts');
    expect(p).toBe(path.join(root, 'src/index.ts'));
  });

  it('allows a base path outside a previous allowlist-only root', async () => {
    const p = await guard.validatePath(outside, 'x');
    expect(p).toBe(path.join(outside, 'x'));
  });

  it('rejects traversal outside base', async () => {
    await expect(guard.validatePath(root, '../outside')).rejects.toThrow();
  });

  it('rejects base under a forbidden system path', async () => {
    if (process.platform === 'win32') {
      const sys = process.env.SystemRoot || 'C:\\Windows';
      await expect(guard.validatePath(sys, 'foo')).rejects.toThrow(/protected system directory/);
    } else {
      await expect(guard.validatePath('/etc', 'hosts')).rejects.toThrow(/protected system directory/);
    }
  });
});
