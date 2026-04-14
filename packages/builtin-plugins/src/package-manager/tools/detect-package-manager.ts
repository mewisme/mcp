import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import { validateWorkspaceRoot } from '../../_lib/workspace-guard.js';
import { scanLockfilesFromWorkspace } from '../../_lib/package-manager-detect.js';
import { toolError, toolSuccess } from '../../_lib/tool-result.js';

export function createDetectPackageManagerTool(): RegisteredTool {
  return {
    name: 'detect_package_manager',
    description:
      'Walks up from the workspace to find lockfiles and recommends a package manager (precedence: pnpm > bun > yarn > npm).',
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
        const payload = {
          workspaceRoot: scan.workspaceRoot,
          packageRoot: scan.packageRoot,
          recommended: scan.recommended,
          found: {
            pnpmLock: scan.found.pnpmLock,
            yarnLock: scan.found.yarnLock,
            npmLock: scan.found.npmLock,
            bunLock: scan.found.bunLock,
          },
        };
        return toolSuccess(JSON.stringify(payload, null, 2));
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    },
  };
}
