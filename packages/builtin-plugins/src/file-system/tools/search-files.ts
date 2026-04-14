import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolError, toolSuccess } from './helpers.js';

const execAsync = promisify(exec);

export function createSearchFilesTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'search_files',
    description:
      'Find files by filename substring (not file contents). Matches path segments containing the pattern. For content search use grep.',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string' },
        path: { type: 'string', description: 'Subdirectory to search in' },
        pattern: { type: 'string', description: 'Search pattern (string or part of filename)' }
      },
      required: ['basePath', 'path', 'pattern']
    },
    handler: async (args) => {
      try {
        const fullPath = await guard.validatePath(String(args.basePath), String(args.path));
        const pattern = String(args.pattern);
        const platform = os.platform();
        let stdout = '';

        if (platform === 'win32') {
          const cmd = `powershell -Command "Get-ChildItem -Path '${fullPath}' -Filter '*${pattern}*' -Recurse -Name"`;
          const result = await execAsync(cmd);
          stdout = result.stdout;
        } else {
          const cmd = `find "${fullPath}" -name "*${pattern}*"`;
          const result = await execAsync(cmd);
          stdout = result.stdout;
        }

        return toolSuccess(stdout || 'No matches found');
      } catch (err: unknown) {
        return toolError(`Search failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  };
}
