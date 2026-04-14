import * as fs from 'fs/promises';
import * as path from 'path';
import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import { validateWorkspaceRoot } from '../../_lib/workspace-guard.js';
import { scanLockfilesFromWorkspace } from '../../_lib/package-manager-detect.js';
import { toolError, toolSuccess } from '../../_lib/tool-result.js';

async function statSummary(filePath: string | null): Promise<{
  path: string | null;
  size: number | null;
  mtimeMs: number | null;
}> {
  if (!filePath) return { path: null, size: null, mtimeMs: null };
  try {
    const st = await fs.stat(filePath);
    return { path: filePath, size: st.size, mtimeMs: st.mtimeMs };
  } catch {
    return { path: filePath, size: null, mtimeMs: null };
  }
}

export function createLockfilePresenceTool(): RegisteredTool {
  return {
    name: 'lockfile_presence',
    description: 'Returns which lockfiles exist (walking up from the workspace) with size and mtime.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceRoot: { type: 'string' },
      },
      required: ['workspaceRoot'],
    },
    handler: async (args) => {
      try {
        const cwd = validateWorkspaceRoot(process.env, String(args.workspaceRoot));
        const scan = await scanLockfilesFromWorkspace(cwd);
        const names = ['pnpmLock', 'yarnLock', 'npmLock', 'bunLock'] as const;
        const details: Record<string, unknown> = {};
        for (const key of names) {
          const p = scan.found[key];
          const rel = p ? path.relative(cwd, p) : null;
          const sum = await statSummary(p);
          details[key] = { ...sum, relativePath: rel };
        }
        const payload = {
          workspaceRoot: cwd,
          packageRoot: scan.packageRoot,
          recommended: scan.recommended,
          lockfiles: details,
        };
        return toolSuccess(JSON.stringify(payload, null, 2));
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    },
  };
}
