import * as path from 'path';
import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import { resolvePathWithinWorkspace, validateWorkspaceRoot } from '../../_lib/workspace-guard.js';
import { spawnCapped } from '../../_lib/spawn-capped.js';
import { toolError, toolSuccess } from '../../_lib/tool-result.js';

const MAX_BYTES = 512 * 1024;

export function createGitDiffTool(): RegisteredTool {
  return {
    name: 'git_diff',
    description: 'Runs git diff or git diff --cached with optional paths under the workspace (read-only).',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceRoot: { type: 'string' },
        staged: { type: 'boolean', description: 'If true, diff staged changes (--cached)' },
        paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional paths relative to workspace root',
        },
      },
      required: ['workspaceRoot'],
    },
    handler: async (args) => {
      try {
        const cwd = validateWorkspaceRoot(process.env, String(args.workspaceRoot));
        const staged = Boolean(args.staged);
        const pathsRaw = Array.isArray(args.paths) ? args.paths.map((p) => String(p)) : [];
        const gitArgs = ['diff'];
        if (staged) gitArgs.push('--cached');
        for (const p of pathsRaw) {
          const resolved = resolvePathWithinWorkspace(cwd, p);
          const rel = path.relative(cwd, resolved);
          if (rel.startsWith('..') || path.isAbsolute(rel)) {
            return toolError(`Invalid path: ${p}`);
          }
          gitArgs.push(rel);
        }
        const result = await spawnCapped('git', gitArgs, { cwd, maxBytes: MAX_BYTES });
        const text =
          (result.stdout || '') +
          (result.stderr ? `\n${result.stderr}` : '') +
          (result.truncated ? '\n[output truncated]' : '');
        if (result.code !== 0 && !result.stdout && !result.stderr) {
          return toolError(`git diff failed (exit ${result.code})`);
        }
        return toolSuccess(text.trim() || '(no diff)');
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    },
  };
}
