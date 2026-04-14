import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { resolvePathWithinWorkspace, validateWorkspaceRoot } from './workspace-guard.js';

describe('validateWorkspaceRoot', () => {
  it('allows a normal project directory', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ws-guard-'));
    expect(validateWorkspaceRoot(process.env as NodeJS.ProcessEnv, dir)).toBe(path.resolve(dir));
  });

  it('rejects a forbidden system directory', () => {
    if (process.platform === 'win32') {
      const sys = process.env.SystemRoot || 'C:\\Windows';
      expect(() => validateWorkspaceRoot(process.env as NodeJS.ProcessEnv, sys)).toThrow(/protected system directory/);
    } else {
      expect(() => validateWorkspaceRoot(process.env as NodeJS.ProcessEnv, '/etc')).toThrow(/protected system directory/);
    }
  });
});

describe('resolvePathWithinWorkspace', () => {
  it('resolves nested path', async () => {
    const base = await fs.mkdtemp(path.join(os.tmpdir(), 'nested-'));
    const got = resolvePathWithinWorkspace(base, path.join('c', 'd'));
    expect(got.startsWith(path.resolve(base))).toBe(true);
  });

  it('rejects traversal', () => {
    const base = path.join(os.tmpdir(), 'ws');
    expect(() => resolvePathWithinWorkspace(base, path.join('..', '..', 'etc'))).toThrow(/Access denied/);
  });
});
