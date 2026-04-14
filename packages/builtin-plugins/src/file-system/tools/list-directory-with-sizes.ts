import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolError, toolSuccess } from './helpers.js';

export function createListDirectoryWithSizesTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'list_directory_with_sizes',
    description: 'List contents of a directory with file sizes',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string' },
        path: { type: 'string' }
      },
      required: ['basePath', 'path']
    },
    handler: async (args) => {
      try {
        const fullPath = await guard.validatePath(String(args.basePath), String(args.path));
        const entries = await fs.readdir(fullPath);
        const details = await Promise.all(
          entries.map(async (name) => {
            const stats = await fs.stat(path.join(fullPath, name));
            const size = stats.isDirectory() ? '-' : `${stats.size} B`;
            const type = stats.isDirectory() ? '[DIR]' : '[FILE]';
            return `${type.padEnd(8)} ${name.padEnd(30)} ${size}`;
          })
        );
        return toolSuccess(details.join('\n') || 'Directory is empty');
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
