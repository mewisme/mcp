import * as fs from 'fs/promises';
import * as path from 'path';

export type InferredPackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun' | 'unknown';

export interface LockfileScanResult {
  workspaceRoot: string;
  /** Nearest package.json directory when walking up (if any). */
  packageRoot: string | null;
  /** Which lockfiles exist under the scan (by walking up to fs root). */
  found: {
    pnpmLock: string | null;
    yarnLock: string | null;
    npmLock: string | null;
    bunLock: string | null;
  };
  /** Recommended manager by precedence: pnpm > bun > yarn > npm. */
  recommended: InferredPackageManager;
}

const LOCK_NAMES = {
  pnpm: 'pnpm-lock.yaml',
  yarn: 'yarn.lock',
  npm: 'package-lock.json',
  bun: ['bun.lockb', 'bun.lock'] as const,
} as const;

async function fileExistsAt(dir: string, name: string): Promise<string | null> {
  const full = path.join(dir, name);
  try {
    const st = await fs.stat(full);
    return st.isFile() ? full : null;
  } catch {
    return null;
  }
}

async function scanDirectoryForLocks(dir: string): Promise<LockfileScanResult['found']> {
  const pnpmLock = await fileExistsAt(dir, LOCK_NAMES.pnpm);
  const yarnLock = await fileExistsAt(dir, LOCK_NAMES.yarn);
  const npmLock = await fileExistsAt(dir, LOCK_NAMES.npm);
  let bunLock: string | null = null;
  for (const n of LOCK_NAMES.bun) {
    const p = await fileExistsAt(dir, n);
    if (p) {
      bunLock = p;
      break;
    }
  }
  return { pnpmLock, yarnLock, npmLock, bunLock };
}

function recommendFromFound(found: LockfileScanResult['found']): InferredPackageManager {
  if (found.pnpmLock) return 'pnpm';
  if (found.bunLock) return 'bun';
  if (found.yarnLock) return 'yarn';
  if (found.npmLock) return 'npm';
  return 'unknown';
}

/**
 * Walks upward from `startDir` collecting lockfiles; picks the innermost `package.json` directory as package root.
 */
export async function scanLockfilesFromWorkspace(startDir: string): Promise<LockfileScanResult> {
  const resolvedStart = path.resolve(startDir);
  let current = resolvedStart;
  let packageRoot: string | null = null;

  const merged: LockfileScanResult['found'] = {
    pnpmLock: null,
    yarnLock: null,
    npmLock: null,
    bunLock: null,
  };

  for (;;) {
    try {
      const pkg = path.join(current, 'package.json');
      await fs.access(pkg);
      if (!packageRoot) packageRoot = current;
    } catch {
      /* no package.json */
    }

    const found = await scanDirectoryForLocks(current);
    merged.pnpmLock = merged.pnpmLock ?? found.pnpmLock;
    merged.yarnLock = merged.yarnLock ?? found.yarnLock;
    merged.npmLock = merged.npmLock ?? found.npmLock;
    merged.bunLock = merged.bunLock ?? found.bunLock;

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return {
    workspaceRoot: resolvedStart,
    packageRoot,
    found: merged,
    recommended: recommendFromFound(merged),
  };
}
