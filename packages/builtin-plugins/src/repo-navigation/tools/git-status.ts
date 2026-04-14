import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import { validateWorkspaceRoot } from '../../_lib/workspace-guard.js';
import { spawnCapped } from '../../_lib/spawn-capped.js';
import { toolError, toolSuccess } from '../../_lib/tool-result.js';

const MAX_BYTES = 512 * 1024;

export function createGitStatusTool(): RegisteredTool {
  return {
    name: 'git_status',
    description: 'Runs git status --porcelain=v1 -b in the workspace (read-only).',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceRoot: { type: 'string', description: 'Repository root (must not be a blocked system directory)' },
      },
      required: ['workspaceRoot'],
    },
    handler: async (args) => {
      try {
        const cwd = validateWorkspaceRoot(process.env, String(args.workspaceRoot));
        const result = await spawnCapped(
          'git',
          ['status', '--porcelain=v1', '-b'],
          { cwd, maxBytes: MAX_BYTES },
        );
        const text =
          (result.stdout || '') +
          (result.stderr ? `\n${result.stderr}` : '') +
          (result.truncated ? '\n[output truncated]' : '');
        if (result.code !== 0 && !result.stdout && !result.stderr) {
          return toolError(`git status failed (exit ${result.code}). Is this a Git repository?`);
        }
        return toolSuccess(text.trim() || '(empty)');
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    },
  };
}
