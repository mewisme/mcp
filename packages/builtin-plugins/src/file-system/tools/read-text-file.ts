import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolError, toolSuccess } from './helpers.js';

export function createReadTextFileTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'read_text_file',
    description: 'Read a text file from the host filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string', description: 'Mandatory base path' },
        path: { type: 'string', description: 'Path to the file relative to base path' }
      },
      required: ['basePath', 'path']
    },
    handler: async (args) => {
      try {
        const fullPath = await guard.validatePath(String(args.basePath), String(args.path));
        const content = await fs.readFile(fullPath, 'utf-8');
        return toolSuccess(content);
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
