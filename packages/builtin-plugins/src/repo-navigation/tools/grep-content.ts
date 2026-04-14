import * as fs from 'fs';
import * as path from 'path';
import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import { validateWorkspaceRoot } from '../../_lib/workspace-guard.js';
import { spawnCapped } from '../../_lib/spawn-capped.js';
import { toolError, toolSuccess } from '../../_lib/tool-result.js';

const MAX_BYTES = 512 * 1024;
const MAX_PATTERN_LEN = 256;

export function createGrepContentTool(): RegisteredTool {
  return {
    name: 'grep_content',
    description:
      'Searches file contents under the workspace using git grep when inside a Git repo, otherwise ripgrep (rg) if available.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceRoot: { type: 'string' },
        pattern: { type: 'string', description: 'Search pattern (passed as a single argument, not shell-expanded)' },
      },
      required: ['workspaceRoot', 'pattern'],
    },
    handler: async (args) => {
      try {
        const cwd = validateWorkspaceRoot(process.env, String(args.workspaceRoot));
        const pattern = String(args.pattern);
        if (pattern.length > MAX_PATTERN_LEN) {
          return toolError(`Pattern exceeds max length (${MAX_PATTERN_LEN})`);
        }

        const gitDir = path.join(cwd, '.git');
        const useGit = fs.existsSync(gitDir);

        if (useGit) {
          const result = await spawnCapped(
            'git',
            ['grep', '-n', '-I', '--', pattern],
            { cwd, maxBytes: MAX_BYTES },
          );
          const text =
            (result.stdout || '') +
            (result.stderr && !result.stderr.includes('exit code 1') ? `\n${result.stderr}` : '');
          if (result.code === 1 && !result.stdout) {
            return toolSuccess('No matches');
          }
          if (result.code !== 0 && result.code !== 1) {
            return toolError(`git grep failed (exit ${result.code}): ${text || 'unknown'}`);
          }
          return toolSuccess((text + (result.truncated ? '\n[output truncated]' : '')).trim());
        }

        try {
          const rgResult = await spawnCapped(
            'rg',
            ['-n', '-S', '--max-count', '200', '--max-columns', '300', '--', pattern, '.'],
            { cwd, maxBytes: MAX_BYTES },
          );
          if (rgResult.code === 1 && !rgResult.stdout) {
            return toolSuccess('No matches');
          }
          if (rgResult.code !== 0 && rgResult.code !== 1) {
            return toolError(`rg failed (exit ${rgResult.code}): ${rgResult.stderr || rgResult.stdout}`);
          }
          const out =
            (rgResult.stdout || '') + (rgResult.truncated ? '\n[output truncated]' : '');
          return toolSuccess(out.trim());
        } catch {
          return toolError(
            'Not a Git repository and ripgrep (rg) is not available on PATH. Initialize Git or install ripgrep.',
          );
        }
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    },
  };
}
