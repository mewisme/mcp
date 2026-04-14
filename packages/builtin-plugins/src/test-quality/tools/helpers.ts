import { scanLockfilesFromWorkspace } from '../../_lib/package-manager-detect.js';
import type { InferredPackageManager } from '../../_lib/package-manager-detect.js';

export type PackageManagerChoice = InferredPackageManager | 'auto';

export async function resolvePackageManager(
  workspaceRoot: string,
  choice: PackageManagerChoice,
): Promise<InferredPackageManager> {
  if (choice !== 'auto' && choice !== 'unknown') {
    return choice;
  }
  const scan = await scanLockfilesFromWorkspace(workspaceRoot);
  if (scan.recommended !== 'unknown') {
    return scan.recommended;
  }
  return 'npm';
}

export interface ScriptInvocation {
  command: string;
  args: string[];
}

/** Workspace filter is only forwarded for pnpm (monorepos). */
export function buildRunTests(pm: InferredPackageManager, filter?: string): ScriptInvocation {
  const f = filter?.trim();
  if (pm === 'pnpm') {
    const args = ['test'];
    if (f) args.push('--filter', f);
    return { command: 'pnpm', args };
  }
  if (pm === 'yarn') {
    return { command: 'yarn', args: ['test'] };
  }
  if (pm === 'bun') {
    return { command: 'bun', args: ['test'] };
  }
  return { command: 'npm', args: ['test'] };
}

export function buildRunLint(pm: InferredPackageManager, filter?: string): ScriptInvocation {
  const f = filter?.trim();
  if (pm === 'pnpm') {
    const args = ['lint'];
    if (f) args.push('--filter', f);
    return { command: 'pnpm', args };
  }
  if (pm === 'yarn') {
    return { command: 'yarn', args: ['lint'] };
  }
  if (pm === 'bun') {
    return { command: 'bun', args: ['run', 'lint'] };
  }
  return { command: 'npm', args: ['run', 'lint'] };
}

export function buildCheckTypes(pm: InferredPackageManager, filter?: string): ScriptInvocation {
  const f = filter?.trim();
  if (pm === 'pnpm') {
    const args = ['check-types'];
    if (f) args.push('--filter', f);
    return { command: 'pnpm', args };
  }
  if (pm === 'yarn') {
    return { command: 'yarn', args: ['check-types'] };
  }
  if (pm === 'bun') {
    return { command: 'bun', args: ['run', 'check-types'] };
  }
  return { command: 'npm', args: ['run', 'check-types'] };
}
