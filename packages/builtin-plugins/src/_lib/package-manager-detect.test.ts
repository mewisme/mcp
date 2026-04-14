import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { scanLockfilesFromWorkspace } from './package-manager-detect.js';

describe('scanLockfilesFromWorkspace', () => {
  it('detects pnpm lock with precedence', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pm-test-'));
    await fs.writeFile(path.join(dir, 'pnpm-lock.yaml'), 'lockfile: true\n', 'utf8');
    await fs.writeFile(path.join(dir, 'package-lock.json'), '{}', 'utf8');
    const r = await scanLockfilesFromWorkspace(dir);
    expect(r.recommended).toBe('pnpm');
    expect(r.found.pnpmLock).toBeTruthy();
    expect(r.found.npmLock).toBeTruthy();
  });

  it('detects bun when no pnpm', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pm-test-'));
    await fs.writeFile(path.join(dir, 'bun.lock'), '', 'utf8');
    const r = await scanLockfilesFromWorkspace(dir);
    expect(r.recommended).toBe('bun');
  });
});
