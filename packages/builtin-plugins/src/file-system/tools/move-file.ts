import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolError, toolSuccess } from './helpers.js';

export function createMoveFileTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'move_file',
    description: 'Move or rename a file/directory',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string' },
        source: { type: 'string' },
        destination: { type: 'string' }
      },
      required: ['basePath', 'source', 'destination']
    },
    handler: async (args) => {
      try {
        const basePath = String(args.basePath);
        const sourcePath = await guard.validatePath(basePath, String(args.source));
        const destPath = await guard.validatePath(basePath, String(args.destination));
        await fs.rename(sourcePath, destPath);
        return toolSuccess(`Moved ${args.source} to ${args.destination}`);
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
