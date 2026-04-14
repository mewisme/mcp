import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolError, toolSuccess } from './helpers.js';

export function createRemoveDirectoryTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'remove_directory',
    description: 'Remove a directory',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string' },
        path: { type: 'string' },
        recursive: { type: 'boolean', default: false }
      },
      required: ['basePath', 'path']
    },
    handler: async (args) => {
      try {
        const fullPath = await guard.validatePath(String(args.basePath), String(args.path));
        const recursive = Boolean(args.recursive);
        await fs.rm(fullPath, { recursive, force: true });
        return toolSuccess(`Directory removed: ${args.path}`);
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
