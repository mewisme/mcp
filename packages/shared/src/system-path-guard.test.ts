import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { isPathUnderForbiddenSystemPath } from './system-path-guard.js';

describe('isPathUnderForbiddenSystemPath', () => {
  it('allows a temp directory', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sys-guard-'));
    expect(isPathUnderForbiddenSystemPath(dir)).toBe(false);
  });

  it('blocks /etc on Unix', () => {
    if (os.platform() === 'win32') {
      expect(true).toBe(true);
      return;
    }
    expect(isPathUnderForbiddenSystemPath('/etc')).toBe(true);
    expect(isPathUnderForbiddenSystemPath('/etc/hosts')).toBe(true);
  });

  it('blocks Windows system root subtree', () => {
    if (os.platform() !== 'win32') {
      expect(true).toBe(true);
      return;
    }
    const sys = process.env.SystemRoot || 'C:\\Windows';
    expect(isPathUnderForbiddenSystemPath(sys)).toBe(true);
    expect(isPathUnderForbiddenSystemPath(path.join(sys, 'System32'))).toBe(true);
  });
});
