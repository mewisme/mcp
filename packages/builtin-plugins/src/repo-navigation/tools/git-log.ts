import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import { validateWorkspaceRoot } from '../../_lib/workspace-guard.js';
import { spawnCapped } from '../../_lib/spawn-capped.js';
import { toolError, toolSuccess } from '../../_lib/tool-result.js';

const MAX_BYTES = 512 * 1024;
const MAX_COUNT_CAP = 50;

export function createGitLogTool(): RegisteredTool {
  return {
    name: 'git_log',
    description: 'Runs git log --oneline with a capped count (read-only).',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceRoot: { type: 'string' },
        maxCount: { type: 'number', description: 'Number of commits (1–50)', default: 20 },
      },
      required: ['workspaceRoot'],
    },
    handler: async (args) => {
      try {
        const cwd = validateWorkspaceRoot(process.env, String(args.workspaceRoot));
        let n = typeof args.maxCount === 'number' ? Math.floor(args.maxCount) : 20;
        if (Number.isNaN(n) || n < 1) n = 20;
        if (n > MAX_COUNT_CAP) n = MAX_COUNT_CAP;
        const result = await spawnCapped(
          'git',
          ['log', '--oneline', '-n', String(n)],
          { cwd, maxBytes: MAX_BYTES },
        );
        const text =
          (result.stdout || '') +
          (result.stderr ? `\n${result.stderr}` : '') +
          (result.truncated ? '\n[output truncated]' : '');
        if (result.code !== 0 && !result.stdout && !result.stderr) {
          return toolError(`git log failed (exit ${result.code})`);
        }
        return toolSuccess(text.trim() || '(empty)');
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    },
  };
}
