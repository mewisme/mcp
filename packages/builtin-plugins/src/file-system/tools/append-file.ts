import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolError, toolSuccess } from './helpers.js';

export function createAppendFileTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'append_file',
    description: 'Append text to the end of a file (creates the file if it does not exist).',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string' },
        path: { type: 'string' },
        content: { type: 'string' }
      },
      required: ['basePath', 'path', 'content']
    },
    handler: async (args) => {
      try {
        const fullPath = await guard.validatePath(String(args.basePath), String(args.path));
        await fs.appendFile(fullPath, String(args.content), 'utf-8');
        return toolSuccess(`Appended to: ${args.path}`);
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
