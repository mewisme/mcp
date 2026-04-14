import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolError, toolSuccess } from './helpers.js';

export function createListDirectoryTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'list_directory',
    description: 'List contents of a directory',
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
        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        const list = entries.map((e) => `${e.isDirectory() ? '[DIR]' : '[FILE]'} ${e.name}`).join('\n');
        return toolSuccess(list || 'Directory is empty');
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
