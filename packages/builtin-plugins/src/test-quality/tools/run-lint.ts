import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import { validateWorkspaceRoot } from '../../_lib/workspace-guard.js';
import { spawnCapped } from '../../_lib/spawn-capped.js';
import { toolError, toolSuccess } from '../../_lib/tool-result.js';
import { buildRunLint, resolvePackageManager, type PackageManagerChoice } from './helpers.js';

const MAX_BYTES = 512 * 1024;

export function createRunLintTool(): RegisteredTool {
  return {
    name: 'run_lint',
    description: 'Runs the lint script (e.g. pnpm lint). Optional pnpm --filter.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceRoot: { type: 'string' },
        packageManager: {
          type: 'string',
          enum: ['auto', 'pnpm', 'npm', 'yarn', 'bun'],
        },
        filter: { type: 'string' },
      },
      required: ['workspaceRoot'],
    },
    handler: async (args) => {
      try {
        const cwd = validateWorkspaceRoot(process.env, String(args.workspaceRoot));
        const choice = (args.packageManager as PackageManagerChoice) ?? 'auto';
        const pm = await resolvePackageManager(cwd, choice);
        const filter = args.filter !== undefined ? String(args.filter) : undefined;
        const inv = buildRunLint(pm, filter);
        const result = await spawnCapped(inv.command, inv.args, { cwd, maxBytes: MAX_BYTES });
        const text =
          `exit ${result.code}\n` +
          (result.stdout || '') +
          (result.stderr ? `\n${result.stderr}` : '') +
          (result.truncated ? '\n[output truncated]' : '');
        return toolSuccess(text.trim());
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    },
  };
}
